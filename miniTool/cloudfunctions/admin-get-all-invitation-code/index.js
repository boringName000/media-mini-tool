// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    console.log("开始获取所有邀请码数据");

    // 获取所有邀请码数据，按创建时间倒序排列
    const result = await db
      .collection("invitation-code-mgr")
      .orderBy("createTime", "desc")
      .get();

    console.log(`成功获取 ${result.data.length} 条邀请码数据`);

    // 处理数据，添加状态信息
    const currentTime = Date.now();
    const expirationDays = 30; // 邀请码有效期30天
    const expirationTime = expirationDays * 24 * 60 * 60 * 1000;

    const processedData = result.data.map(item => {
      // 处理创建时间
      let createTime = item.createTime;
      let createTimeTimestamp = null;
      
      if (createTime) {
        try {
          if (createTime._seconds) {
            // db.serverDate() 格式
            createTimeTimestamp = createTime._seconds * 1000;
            createTime = new Date(createTimeTimestamp);
          } else if (createTime.toDate) {
            // Firestore Timestamp 格式
            createTime = createTime.toDate();
            createTimeTimestamp = createTime.getTime();
          } else {
            // 普通 Date 格式或字符串
            createTime = new Date(createTime);
            createTimeTimestamp = createTime.getTime();
          }
        } catch (error) {
          console.error("处理创建时间失败：", error);
          createTime = null;
          createTimeTimestamp = null;
        }
      }

      // 计算是否过期
      let isExpired = false;
      let remainingDays = null;
      
      if (createTimeTimestamp) {
        const timeDiff = currentTime - createTimeTimestamp;
        isExpired = timeDiff > expirationTime;
        
        if (!isExpired) {
          remainingDays = Math.ceil((expirationTime - timeDiff) / (24 * 60 * 60 * 1000));
        }
      }

      return {
        invitationCode: item.invitationCode,
        createTime: createTime,
        creatorId: item.creatorId,
        isExpired: isExpired,
        remainingDays: remainingDays,
        expirationDays: expirationDays
      };
    });

    // 统计信息
    const totalCount = processedData.length;
    const expiredCount = processedData.filter(item => item.isExpired).length;
    const validCount = totalCount - expiredCount;

    return {
      success: true,
      data: processedData,
      statistics: {
        totalCount: totalCount,
        validCount: validCount,
        expiredCount: expiredCount
      },
      timestamp: new Date().toISOString(),
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };

  } catch (error) {
    console.error("获取邀请码数据失败：", error);
    return {
      success: false,
      error: error.message,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};