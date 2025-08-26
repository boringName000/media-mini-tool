// create-daily-tasks 云函数部署状态检查脚本

const fs = require("fs");
const path = require("path");

console.log("🔍 检查 create-daily-tasks 云函数部署状态...\n");

// 检查项目结构
const checks = [
  {
    name: "package.json",
    path: "package.json",
    required: true,
    type: "file",
  },
  {
    name: "index.js",
    path: "index.js",
    required: true,
    type: "file",
  },
  {
    name: "node_modules",
    path: "node_modules",
    required: true,
    type: "directory",
  },
  {
    name: "wx-server-sdk",
    path: "node_modules/wx-server-sdk",
    required: true,
    type: "directory",
  },
  {
    name: "config.json",
    path: "config.json",
    required: true,
    type: "file",
  },
  {
    name: "README.md",
    path: "README.md",
    required: false,
    type: "file",
  },
];

let allPassed = true;

checks.forEach((check) => {
  const exists = fs.existsSync(check.path);
  const isDirectory = exists && fs.statSync(check.path).isDirectory();
  const isFile = exists && fs.statSync(check.path).isFile();

  let status = "❌";
  let message = "缺失";

  if (exists) {
    if (check.type === "directory" && isDirectory) {
      status = "✅";
      message = "存在";
    } else if (check.type === "file" && isFile) {
      status = "✅";
      message = "存在";
    } else {
      status = "⚠️";
      message = "类型不匹配";
      allPassed = false;
    }
  } else if (check.required) {
    allPassed = false;
  } else {
    status = "⚠️";
    message = "可选文件缺失";
  }

  console.log(`${status} ${check.name}: ${message}`);
});

// 检查 package.json 内容
console.log("\n📦 检查 package.json 内容...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  console.log(`✅ 项目名称: ${packageJson.name}`);
  console.log(`✅ 版本: ${packageJson.version}`);
  console.log(`✅ 主文件: ${packageJson.main}`);

  if (packageJson.dependencies && packageJson.dependencies["wx-server-sdk"]) {
    console.log(
      `✅ wx-server-sdk 版本: ${packageJson.dependencies["wx-server-sdk"]}`
    );
  } else {
    console.log("❌ wx-server-sdk 依赖缺失");
    allPassed = false;
  }
} catch (error) {
  console.log("❌ package.json 解析失败:", error.message);
  allPassed = false;
}

// 检查云函数语法
console.log("\n🔧 检查云函数语法...");
try {
  require("./index.js");
  console.log("✅ 云函数语法检查通过");
} catch (error) {
  console.log("❌ 云函数语法错误:", error.message);
  allPassed = false;
}

// 检查文件大小
console.log("\n📊 文件大小统计...");
try {
  const indexStats = fs.statSync("index.js");
  const sizeKB = (indexStats.size / 1024).toFixed(2);
  console.log(`✅ index.js 大小: ${sizeKB} KB`);

  if (indexStats.size > 1024 * 1024) {
    console.log("⚠️ 警告: 云函数文件较大，可能影响部署速度");
  }
} catch (error) {
  console.log("❌ 无法获取文件大小:", error.message);
}

// 总结
console.log("\n📋 部署状态总结:");
if (allPassed) {
  console.log("✅ 所有检查通过，云函数已准备就绪！");
  console.log("\n🚀 可以开始部署:");
  console.log("   1. 使用微信开发者工具部署");
  console.log(
    "   2. 或运行: ./scripts/clouddeploy/deploy-create-daily-tasks.sh"
  );
} else {
  console.log("❌ 存在一些问题，请修复后重新检查");
  console.log("\n🔧 建议操作:");
  console.log("   1. 运行: npm install");
  console.log("   2. 检查云函数代码");
  console.log("   3. 重新运行此检查脚本");
}

console.log("\n✨ 检查完成！");
