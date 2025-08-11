# 数据库测试页面

## 功能说明

这个页面用于测试云数据库"user-info"的数据添加功能。

## 功能特性

1. **数据添加**：可以向"user-info"数据库集合添加用户数据
2. **字段包含**：
   - `name`：用户名
   - `time`：当前时间
   - `openid`：用户 OpenID
   - `appid`：小程序 AppID
   - `unionid`：用户 UnionID
   - `createTime`：服务器时间戳

## 使用方法

1. 在首页点击"数据库测试"按钮
2. 在测试页面输入用户名
3. 点击"添加数据到数据库"按钮
4. 查看添加结果

## 云函数说明

对应的云函数位于：`cloudfunctions/test/index.js`

该云函数会：

- 接收前端传递的用户名
- 自动添加当前时间和用户信息
- 将数据插入到"user-info"集合
- 返回操作结果

## 数据库结构

```javascript
{
  name: "用户名",
  time: "当前时间",
  openid: "用户OpenID",
  appid: "小程序AppID",
  unionid: "用户UnionID",
  createTime: "服务器时间戳"
}
```

## 注意事项

1. 确保云开发环境已正确配置
2. 确保"user-info"集合已创建
3. 确保云函数已部署
4. 需要用户授权才能获取 OpenID 等信息
