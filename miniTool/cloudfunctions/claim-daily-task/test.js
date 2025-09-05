// 测试文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 测试数据
const testData = {
  userId: "test_user_123",
  accountId: "AC00001",
  taskId: "ART1123456123",
};

// 测试函数
async function testClaimDailyTask() {
  try {
    console.log("开始测试领取每日任务云函数...");
    console.log("测试数据:", testData);

    // 调用云函数
    const result = await cloud.callFunction({
      name: "claim-daily-task",
      data: testData,
    });

    console.log("云函数返回结果:", JSON.stringify(result, null, 2));

    if (result.result.success) {
      console.log("✅ 测试成功");
      console.log("领取的任务:", result.result.data.claimedTask);
      console.log("全部任务数量:", result.result.data.totalTasks);
    } else {
      console.log("❌ 测试失败");
      console.log("错误信息:", result.result.message);
    }
  } catch (error) {
    console.error("❌ 测试异常:", error);
  }
}

// 运行测试
testClaimDailyTask();
