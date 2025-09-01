// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 随机选择文章的通用函数
async function selectRandomArticle(account, publishedArticleIds) {
  try {
    // 从 article-mgr 数据库中随机选取一个符合赛道类型的文章
    const articleResult = await db
      .collection("article-mgr")
      .aggregate()
      // 1. 用 match 替代 where 做条件过滤
      .match({
        trackType: account.trackType,
        articleId: db.command.nin(publishedArticleIds), // 排除已发布的文章
      })
      // 2. 随机选择1条
      .sample({ size: 1 })
      .end();

    if (articleResult.list.length === 0) {
      console.log(`账号 ${account.accountId} 没有找到合适的文章`);
      return null;
    }

    const selectedArticle = articleResult.list[0];
    console.log(
      `账号 ${account.accountId} 随机选择文章: ${selectedArticle.articleId}`
    );
    return selectedArticle;
  } catch (error) {
    console.error(`为账号 ${account.accountId} 选择文章失败:`, error);
    return null;
  }
}

// 为新账号创建初始任务的辅助函数
async function createInitialTask(account, publishedArticleIds) {
  try {
    const selectedArticle = await selectRandomArticle(
      account,
      publishedArticleIds
    );

    if (!selectedArticle) {
      console.log(
        `账号 ${account.accountId} 没有找到合适的文章，无法创建初始任务`
      );
      return null;
    }

    const currentTime = new Date();

    // 创建初始任务
    const initialTask = {
      articleId: selectedArticle.articleId,
      articleTitle: selectedArticle.articleTitle,
      trackType: selectedArticle.trackType,
      platformType: selectedArticle.platformType,
      downloadUrl: selectedArticle.downloadUrl,
      taskTime: currentTime,
      isCompleted: false, // 新任务默认为未完成状态
    };

    return initialTask;
  } catch (error) {
    console.error(`为账号 ${account.accountId} 创建初始任务失败:`, error);
    return null;
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

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    let updatedAccounts = [];
    let totalTasksCreated = 0;
    let totalTasksSkipped = 0;
    let totalTasksContinued = 0;

    // 遍历用户的所有账号
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      let dailyTasks = account.dailyTasks || [];
      let accountUpdated = false;
      let tasksCreated = 0;
      let tasksSkipped = 0;
      let tasksContinued = 0; // 继续使用原文章的任务数

      // 获取该账号已发布的文章ID列表
      const publishedArticleIds = (account.posts || []).map(
        (post) => post.articleId
      );

      // 如果是新账号（没有 dailyTasks 或 dailyTasks 为空），初始化一个任务
      if (!dailyTasks || dailyTasks.length === 0) {
        console.log(`账号 ${account.accountId} 没有每日任务，开始初始化...`);

        // 为新账号创建初始任务
        const initialTask = await createInitialTask(
          account,
          publishedArticleIds
        );
        if (initialTask) {
          dailyTasks = [initialTask];
          accountUpdated = true;
          tasksCreated = 1;
          console.log(`账号 ${account.accountId} 初始化任务成功:`, initialTask);
        } else {
          console.log(`账号 ${account.accountId} 初始化任务失败，跳过该账号`);
          continue;
        }
      }

      // 检查每个任务的时间
      for (let j = 0; j < dailyTasks.length; j++) {
        const task = dailyTasks[j];
        const taskTime = new Date(task.taskTime);

        // 检查当前任务的文章是否已经完成
        const currentTaskArticleId = task.articleId;
        const isTaskCompleted =
          publishedArticleIds.includes(currentTaskArticleId);

        // 如果任务时间在今天范围内，只更新完成状态
        if (taskTime >= startOfDay && taskTime <= endOfDay) {
          // 检查是否需要更新 isCompleted 状态
          if (task.isCompleted !== isTaskCompleted) {
            dailyTasks[j] = {
              ...task,
              isCompleted: isTaskCompleted,
            };
            accountUpdated = true;
          }
          tasksSkipped++;
          continue;
        }

        // 任务时间已过期，需要更新

        let selectedArticle = null;

        if (!isTaskCompleted) {
          // 如果任务未完成，直接使用原有任务对象中的完整信息
          selectedArticle = {
            articleId: task.articleId,
            articleTitle: task.articleTitle,
            trackType: task.trackType,
            platformType: task.platformType,
            downloadUrl: task.downloadUrl,
          };
          tasksContinued++;
        } else {
          // 如果任务已完成，需要分配新文章
          selectedArticle = await selectRandomArticle(
            account,
            publishedArticleIds
          );

          if (!selectedArticle) {
            // 如果没有找到合适的文章，跳过这个任务
            tasksSkipped++;
            continue;
          }
        }

        // 生成新的任务时间（使用当前时间）
        const newTaskTime = new Date();

        // 更新任务信息
        dailyTasks[j] = {
          articleId: selectedArticle.articleId,
          articleTitle: selectedArticle.articleTitle,
          trackType: selectedArticle.trackType,
          platformType: selectedArticle.platformType,
          downloadUrl: selectedArticle.downloadUrl,
          taskTime: newTaskTime,
          isCompleted: false, // 新任务默认为未完成状态
        };

        tasksCreated++;
        accountUpdated = true;
      }

      if (accountUpdated) {
        // 更新账号的 dailyTasks
        await db
          .collection("user-info")
          .where({
            userId: userId,
            "accounts.accountId": account.accountId,
          })
          .update({
            data: {
              [`accounts.${i}.dailyTasks`]: dailyTasks,
            },
          });

        updatedAccounts.push({
          accountId: account.accountId,
          accountNickname: account.accountNickname,
          tasksCreated: tasksCreated,
          tasksSkipped: tasksSkipped,
          tasksContinued: tasksContinued,
        });
      }

      totalTasksCreated += tasksCreated;
      totalTasksSkipped += tasksSkipped;
      totalTasksContinued += tasksContinued;
    }

    console.log("每日任务创建完成:", {
      userId: userId,
      totalTasksCreated: totalTasksCreated,
      totalTasksSkipped: totalTasksSkipped,
      totalTasksContinued: totalTasksContinued,
      updatedAccounts: updatedAccounts,
    });

    return {
      success: true,
      data: {
        userId: userId,
        totalTasksCreated: totalTasksCreated,
        totalTasksSkipped: totalTasksSkipped,
        totalTasksContinued: totalTasksContinued,
        updatedAccounts: updatedAccounts,
        totalAccounts: accounts.length,
      },
      message: `成功创建 ${totalTasksCreated} 个任务，继续 ${totalTasksContinued} 个任务，跳过 ${totalTasksSkipped} 个任务`,
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
