Component({
  /**
   * 组件的属性列表
   */
  properties: {
    icon: {
      type: String,
      value: "📋",
    },
    name: {
      type: String,
      value: "默认名称",
    },
    description: {
      type: String,
      value: "默认描述",
    },
    type: {
      type: Number,
      value: null,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击事件
    onTap: function () {
      this.triggerEvent("tap", {
        icon: this.properties.icon,
        name: this.properties.name,
        description: this.properties.description,
        type: this.properties.type,
      });
    },
  },
});
