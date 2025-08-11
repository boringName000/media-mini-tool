// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const userName = event.name || "默认用户";

    // 根据openid查询数据库中是否已存在该用户的数据
    const queryResult = await db
      .collection("user-info")
      .where({
        openid: wxContext.OPENID,
      })
      .get();

    let result;
    let operation = "";

    if (queryResult.data.length > 0) {
      // 如果存在该用户的数据，则更新第一条记录
      const existingRecord = queryResult.data[0];
      result = await db
        .collection("user-info")
        .doc(existingRecord._id)
        .update({
          data: {
            name: userName, // 更新用户输入的name
            time: db.serverDate(),
            appid: wxContext.APPID,
            unionid: wxContext.UNIONID,
            updateTime: db.serverDate(), // 使用服务器时间
          },
        });
      operation = "update";
    } else {
      // 如果不存在该用户的数据，则添加新记录
      const userData = {
        name: userName,
        time: db.serverDate(),
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        createTime: db.serverDate(), // 使用服务器时间
      };

      result = await db.collection("user-info").add({
        data: userData,
      });
      operation = "add";
    }

    console.log(
      `数据${operation === "add" ? "添加" : "更新"}成功，文档ID：`,
      result._id || result.stats.updated
    );

    return {
      success: true,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      operation: operation,
      insertedId: result._id || result.stats.updated,
      userName: userName,
    };
  } catch (error) {
    console.error("操作数据失败：", error);
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
