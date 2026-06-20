import { defineTranslations } from "fumadocs-core/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";

export const siteLanguages = {
  en: {
    label: "English",
    htmlLang: "en",
    searchLanguage: "english",
    openInObsidian: "Open in Obsidian",
    heroTagline: "A living knowledge base of the Tariqa Karkariya",
    heroPrimaryCta: "Browse Dictionary →",
    heroSecondaryCta: "Explore all pages",
    dictionaryLabel: "Dictionary — key terms",
    exploreLabel: "Explore",
    backlinksLabel: "Pages that reference this page",
    localGraphLabel: "Connections",
    openGlobalGraphLabel: "Full graph",
    graphLegendPage: "Page",
    graphLegendTag: "Tag",
    graphStatPages: "pages",
    graphStatTags: "tags",
    graphStatLinks: "links",
    readingTimeUnit: "min read",
    recentNotesLabel: "Recently Updated",
    readerModeLabel: "Reader mode",
    readerExitLabel: "Exit reader mode",
    translations: defineTranslations().extend(uiTranslations()),
  },
  cn: {
    label: "简体中文",
    htmlLang: "zh-CN",
    searchLanguage: "chinese",
    openInObsidian: "在 Obsidian 中打开",
    heroTagline: "卡尔卡里亚道团的活知识库",
    heroPrimaryCta: "浏览词典 →",
    heroSecondaryCta: "探索所有页面",
    dictionaryLabel: "词典 — 关键术语",
    exploreLabel: "探索",
    backlinksLabel: "引用此页的页面",
    localGraphLabel: "关联页面",
    openGlobalGraphLabel: "完整图谱",
    graphLegendPage: "页面",
    graphLegendTag: "标签",
    graphStatPages: "页面",
    graphStatTags: "标签",
    graphStatLinks: "连接",
    readingTimeUnit: "分钟阅读",
    recentNotesLabel: "最近更新",
    readerModeLabel: "阅读模式",
    readerExitLabel: "退出阅读模式",
    translations: defineTranslations()
      .extend(uiTranslations())
      .add("ui", {
        search: "搜索文档",
        searchNoResult: "未找到结果",
        searchOpen: "搜索",
        searchClose: "关闭搜索",
        toc: "目录",
        tocNoHeadings: "无标题",
        tocInline: "本页目录",
        lastUpdate: "最后更新于",
        nextPage: "下一页",
        previousPage: "上一页",
        chooseTheme: "主题",
        editOnGithub: "在 GitHub 上编辑",
        themeToggle: "切换主题",
        themeLight: "浅色",
        themeDark: "深色",
        themeSystem: "跟随系统",
        codeBlockCopy: "复制代码",
        codeBlockCopied: "已复制",
        menuToggle: "菜单",
        pageActionsCopyMarkdown: "复制 Markdown",
        pageActionsOpen: "打开",
        pageActionsOpenGitHub: "在 GitHub 上打开",
        pageActionsViewMarkdown: "查看 Markdown",
        sidebarOpen: "打开侧边栏",
        sidebarCollapse: "收起侧边栏",
        notFoundTitle: "页面未找到",
        notFoundDescription: "请检查地址是否正确",
        notFoundLink: "返回首页",
      }),
  },
} as const;

export type SiteLanguage = keyof typeof siteLanguages;

function resolveSiteLanguage(): SiteLanguage {
  const language = process.env.SITE_LANGUAGE;
  if (language && language in siteLanguages) {
    return language as SiteLanguage;
  }

  return "en";
}

export function getSiteLanguage(): (typeof siteLanguages)[SiteLanguage] {
  return siteLanguages[resolveSiteLanguage()];
}
