// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 文章状态枚举
const ArticleStatusEnum = {
  UNUSED: 1, // 未使用
  USED: 2, // 已经使用
  NEED_REVISION: 3, // 待重新修改
};

// 每日任务数量常量
const DAILY_TASKS_COUNT = 10;

// 随机选择文章的通用函数
async function selectRandomArticles(
  account,
  publishedArticleIds,
  count = DAILY_TASKS_COUNT
) {
  try {
    // 从 article-mgr 数据库中随机选取符合赛道类型且状态为未使用的文章
    const articleResult = await db
      .collection("article-mgr")
      .aggregate()
      .match({
        trackType: account.trackType,
        status: ArticleStatusEnum.UNUSED, // 只选择未使用的文章
        articleId: db.command.nin(publishedArticleIds), // 排除已发布的文章
      })
      .sample({ size: count })
      .end();

    if (articleResult.list.length === 0) {
      console.log(`账号 ${account.accountId} 没有找到合适的文章`);
      return [];
    }

    console.log(
      `账号 ${account.accountId} 随机选择了 ${articleResult.list.length} 篇文章`
    );
    return articleResult.list;
  } catch (error) {
    console.error(`为账号 ${account.accountId} 选择文章失败:`, error);
    return [];
  }
}

// 获取文章信息
async function getArticleInfo(articleIds) {
  try {
    const result = await cloud.callFunction({
      name: "get-article-info",
      data: {
        articleIds: articleIds,
      },
    });

    if (result.result && result.result.success) {
      return result.result.data.articles || [];
    } else {
      console.error("获取文章信息失败:", result.result?.message);
      return [];
    }
  } catch (error) {
    console.error("调用 get-article-info 云函数失败:", error);
    return [];
  }
}

// 创建任务对象
function createTaskFromArticle(article) {
  return {
    articleId: article.articleId,
    articleTitle: article.articleTitle,
    trackType: article.trackType,
    platformType: article.platformType,
    downloadUrl: article.downloadUrl,
    taskTime: new Date(),
    isCompleted: false,
    isClaimed: false, // 新增：是否领取任务
  };
}

// 检查任务是否过期
function isTaskExpired(task) {
  if (!task.taskTime) return true;

  const taskDate = new Date(task.taskTime);
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return taskDate < todayStart;
}

// 处理账号的每日任务
async function processAccountDailyTasks(account, userId, accountIndex) {
  try {
    const dailyTasks = account.dailyTasks || [];
    const publishedArticleIds = (account.posts || []).map(
      (post) => post.articleId
    );

    let newDailyTasks = [];
    let tasksCreated = 0;
    let tasksRemoved = 0;
    let tasksUpdated = 0;

    // 如果账号没有 dailyTasks 或 dailyTasks 为空，直接随机生成任务
    if (!dailyTasks || dailyTasks.length === 0) {
      console.log(`账号 ${account.accountId} 没有每日任务，开始初始化...`);

      const selectedArticles = await selectRandomArticles(
        account,
        publishedArticleIds,
        DAILY_TASKS_COUNT
      );
      newDailyTasks = selectedArticles.map((article) =>
        createTaskFromArticle(article)
      );
      tasksCreated = newDailyTasks.length;

      // 更新账号的每日任务
      await db
        .collection("user-info")
        .where({
          userId: userId,
          "accounts.accountId": account.accountId,
        })
        .update({
          data: {
            [`accounts.${accountIndex}.dailyTasks`]: newDailyTasks,
          },
        });

      return {
        accountId: account.accountId,
        accountNickname: account.accountNickname,
        tasksCreated: tasksCreated,
        tasksRemoved: 0,
        tasksUpdated: 1,
        totalTasks: newDailyTasks.length,
      };
    }

    // 检查是否有过期任务
    const hasExpiredTasks = dailyTasks.some((task) => isTaskExpired(task));

    // 检查是否有领取的任务
    const claimedTasks = dailyTasks.filter((task) => task.isClaimed);
    const hasClaimedTasks = claimedTasks.length > 0;

    if (hasExpiredTasks) {
      // 如果有过期任务
      console.log(`账号 ${account.accountId} 有过期任务`);

      if (!hasClaimedTasks) {
        // 没有已领取的任务，全部重新随机
        console.log(`账号 ${account.accountId} 没有已领取的任务，全部重新随机`);

        const selectedArticles = await selectRandomArticles(
          account,
          publishedArticleIds,
          DAILY_TASKS_COUNT
        );
        newDailyTasks = selectedArticles.map((article) =>
          createTaskFromArticle(article)
        );
        tasksCreated = newDailyTasks.length;
        tasksRemoved = dailyTasks.length;
      } else {
        // 有已领取的任务，检查是否完成任务
        console.log(`账号 ${account.accountId} 有已领取的任务，检查完成状态`);

        const isTaskCompleted = claimedTasks.some((task) =>
          publishedArticleIds.includes(task.articleId)
        );

        if (isTaskCompleted) {
          // 如果完成，全部重新随机
          console.log(`账号 ${account.accountId} 任务已完成，全部重新随机`);

          const selectedArticles = await selectRandomArticles(
            account,
            publishedArticleIds,
            DAILY_TASKS_COUNT
          );
          newDailyTasks = selectedArticles.map((article) =>
            createTaskFromArticle(article)
          );
          tasksCreated = newDailyTasks.length;
          tasksRemoved = dailyTasks.length;
        } else {
          // 如果没完成，更新任务时间
          console.log(`账号 ${account.accountId} 任务未完成，更新任务时间`);

          newDailyTasks = dailyTasks.map((task) => ({
            ...task,
            taskTime: new Date(), // 更新任务时间
            isCompleted: false,
          }));
          tasksUpdated = 1;
        }
      }
    } else {
      // 如果没有过期任务
      console.log(`账号 ${account.accountId} 没有过期任务`);

      if (!hasClaimedTasks) {
        // 没有领取的任务，检查每个文章的状态是否可用，更新替换不可用的文章补充
        console.log(`账号 ${account.accountId} 没有领取的任务，检查文章状态`);

        const taskArticleIds = dailyTasks.map((task) => task.articleId);
        const articleInfos = await getArticleInfo(taskArticleIds);

        // 创建文章ID到文章信息的映射
        const articleInfoMap = {};
        articleInfos.forEach((article) => {
          articleInfoMap[article.articleId] = article;
        });

        // 过滤出状态为未使用的任务
        const validTasks = [];
        const invalidTaskIds = [];

        dailyTasks.forEach((task) => {
          const articleInfo = articleInfoMap[task.articleId];
          if (articleInfo && articleInfo.status === ArticleStatusEnum.UNUSED) {
            validTasks.push(task);
          } else {
            invalidTaskIds.push(task.articleId);
          }
        });

        tasksRemoved = invalidTaskIds.length;
        console.log(
          `账号 ${account.accountId} 移除了 ${tasksRemoved} 个不可用的任务`
        );

        // 补齐到10个任务
        const needCount = DAILY_TASKS_COUNT - validTasks.length;
        if (needCount > 0) {
          const usedArticleIds = [
            ...publishedArticleIds,
            ...validTasks.map((task) => task.articleId),
          ];
          const selectedArticles = await selectRandomArticles(
            account,
            usedArticleIds,
            needCount
          );
          const newTasks = selectedArticles.map((article) =>
            createTaskFromArticle(article)
          );

          newDailyTasks = [...validTasks, ...newTasks];
          tasksCreated = newTasks.length;
        } else {
          newDailyTasks = validTasks;
        }
      } else {
        // 有已领取任务，不做处理
        console.log(`账号 ${account.accountId} 有已领取任务，不做处理`);
        newDailyTasks = dailyTasks;
      }
    }

    // 更新账号的每日任务
    if (
      newDailyTasks.length !== dailyTasks.length ||
      JSON.stringify(newDailyTasks) !== JSON.stringify(dailyTasks)
    ) {
      await db
        .collection("user-info")
        .where({
          userId: userId,
          "accounts.accountId": account.accountId,
        })
        .update({
          data: {
            [`accounts.${accountIndex}.dailyTasks`]: newDailyTasks,
          },
        });

      tasksUpdated = 1;
    }

    return {
      accountId: account.accountId,
      accountNickname: account.accountNickname,
      tasksCreated: tasksCreated,
      tasksRemoved: tasksRemoved,
      tasksUpdated: tasksUpdated,
      totalTasks: newDailyTasks.length,
      updatedAccount: {
        ...account,
        dailyTasks: newDailyTasks,
      },
    };
  } catch (error) {
    console.error(`处理账号 ${account.accountId} 每日任务失败:`, error);
    return {
      accountId: account.accountId,
      accountNickname: account.accountNickname,
      error: error.message,
    };
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const { userId } = event;

    // 参数验证
    if (!userId) {
      return {
        success: false,
        error: "缺少必要参数",
        message: "请提供用户ID",
      };
    }

    // 获取用户信息
    const userResult = await db
      .collection("user-info")
      .where({
        userId: userId,
      })
      .get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        error: "用户不存在",
        message: "未找到指定用户",
      };
    }

    const userInfo = userResult.data[0];
    const accounts = userInfo.accounts || [];

    if (accounts.length === 0) {
      return {
        success: false,
        error: "用户无账号",
        message: "用户没有关联的账号",
      };
    }

    let updatedAccounts = [];
    let totalTasksCreated = 0;
    let totalTasksRemoved = 0;
    let totalTasksUpdated = 0;

    // 遍历用户的所有账号
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const result = await processAccountDailyTasks(account, userId, i);

      updatedAccounts.push(result);
      totalTasksCreated += result.tasksCreated || 0;
      totalTasksRemoved += result.tasksRemoved || 0;
      totalTasksUpdated += result.tasksUpdated || 0;
    }

    console.log("每日任务创建完成:", {
      userId: userId,
      totalTasksCreated: totalTasksCreated,
      totalTasksRemoved: totalTasksRemoved,
      totalTasksUpdated: totalTasksUpdated,
      updatedAccounts: updatedAccounts,
    });

    // 组装更新后的 accounts 数据
    const updatedAccountsData = accounts.map((account, index) => {
      const updateInfo = updatedAccounts.find(
        (ua) => ua.accountId === account.accountId
      );
      if (updateInfo && !updateInfo.error && updateInfo.updatedAccount) {
        // 使用更新后的账号数据
        return updateInfo.updatedAccount;
      }
      // 如果更新失败，保持原数据
      return account;
    });

    return {
      success: true,
      data: {
        userId: userId,
        totalTasksCreated: totalTasksCreated,
        totalTasksRemoved: totalTasksRemoved,
        totalTasksUpdated: totalTasksUpdated,
        updatedAccounts: updatedAccounts,
        totalAccounts: accounts.length,
        accounts: updatedAccountsData, // 返回更新后的 accounts 数据
      },
      message: `成功创建 ${totalTasksCreated} 个任务，移除 ${totalTasksRemoved} 个任务，更新 ${totalTasksUpdated} 个账号`,
    };
  } catch (error) {
    console.error("创建每日任务失败:", error);

    return {
      success: false,
      error: error.message || "创建每日任务失败",
      message: "服务器内部错误",
    };
  }
};
