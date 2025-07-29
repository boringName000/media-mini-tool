Component({
  data: {
    selected: 0,
    tabList: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "🏠",
        selectedIcon: "🏠",
      },
      {
        pagePath: "/pages/task/task",
        text: "任务",
        icon: "📋",
        selectedIcon: "📋",
      },
      {
        pagePath: "/pages/me/me",
        text: "我的",
        icon: "👤",
        selectedIcon: "👤",
      },
    ],
  },

  attached() {
    // 组件初始化时获取当前页面路径
    this.updateSelected();
  },

  methods: {
    // 更新选中状态
    updateSelected() {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route;

        const selectedIndex = this.data.tabList.findIndex(
          (item) => item.pagePath === `/${route}`
        );

        if (selectedIndex !== -1) {
          this.setData({
            selected: selectedIndex,
          });
        }
      }
    },

    // 切换标签页
    switchTab(e) {
      const { index } = e.currentTarget.dataset;
      const { pagePath } = this.data.tabList[index];

      // 如果点击的是当前页面，不执行跳转
      if (this.data.selected === index) {
        return;
      }

      // 执行页面跳转
      wx.switchTab({
        url: pagePath,
        success: () => {
          this.setData({
            selected: index,
          });
        },
      });
    },
  },
});
