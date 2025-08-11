// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 生成邀请码函数
function generateInvitationCode() {
  // 准备字符数组：26个字母的大小写（剔除o和i）+ 数字0-9
  const chars = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "m",
    "n",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];

  let invitationCode = "";

  // 随机选择10次，每次从数组中取一个字符
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    invitationCode += chars[randomIndex];
  }

  return invitationCode;
}

// 检查邀请码是否已存在
async function checkInvitationCodeExists(db, invitationCode) {
  try {
    const result = await db
      .collection("invitation-code-mgr")
      .where({
        invitationCode: invitationCode,
      })
      .get();

    return result.data.length > 0; // 如果找到记录，返回true表示已存在
  } catch (error) {
    console.error("检查邀请码是否存在时出错：", error);
    throw error;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    let invitationCode = "";
    let retryCount = 0;
    const maxRetries = 5;
    let isDuplicate = true;

    // 尝试生成不重复的邀请码，最多重试5次
    while (isDuplicate && retryCount < maxRetries) {
      invitationCode = generateInvitationCode();

      // 检查邀请码是否已存在
      isDuplicate = await checkInvitationCodeExists(db, invitationCode);

      if (isDuplicate) {
        retryCount++;
        console.log(
          `邀请码 ${invitationCode} 已存在，第 ${retryCount} 次重试...`
        );
      }
    }

    // 如果重试5次后仍然重复，返回错误
    if (isDuplicate) {
      console.error("重试5次后邀请码仍然重复，请重新创建");
      return {
        success: false,
        error: "邀请码重复，请重新创建",
        retryCount: retryCount,
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 准备要插入的数据（使用服务器时间）
    const invitationData = {
      invitationCode: invitationCode,
      createTime: db.serverDate(),
      creatorId: wxContext.OPENID, // 创建人ID使用openid
    };

    // 向 invitation-code-mgr 集合添加数据
    const result = await db.collection("invitation-code-mgr").add({
      data: invitationData,
    });

    return {
      success: true,
      invitationCode: invitationCode,
      createTime: invitationData.createTime,
      creatorId: wxContext.OPENID,
      insertedId: result._id,
      retryCount: retryCount,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("创建邀请码失败：", error);
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
