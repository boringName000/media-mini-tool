// create-daily-tasks 云函数测试脚本

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 模拟云函数调用
async function testCreateDailyTasks() {
  console.log("🧪 开始测试 create-daily-tasks 云函数...");

  try {
    // 模拟事件参数
    const event = {
      userId: "test_user_id",
    };

    // 模拟上下文
    const context = {
      OPENID: "test_openid",
      APPID: "test_appid",
      UNIONID: "test_unionid",
    };

    console.log("📝 测试参数:");
    console.log("  - userId:", event.userId);
    console.log("  - context:", context);

    // 导入云函数
    const main = require("./index.js").main;

    console.log("🚀 调用云函数...");
    const result = await main(event, context);

    console.log("📊 测试结果:");
    console.log("  - success:", result.success);
    console.log("  - message:", result.message);

    if (result.success) {
      console.log("  - data:", JSON.stringify(result.data, null, 2));
    } else {
      console.log("  - error:", result.error);
    }

    console.log("✅ 测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

// 运行测试
if (require.main === module) {
  testCreateDailyTasks();
}

module.exports = {
  testCreateDailyTasks,
};
