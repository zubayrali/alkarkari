// Generated from the canonical locale shape. Keep this explicit contract in
// sync with keystatic.config.ts when adding or restructuring fields.

export interface MishkatCitation {
  text: string;
  source: string;
}

export interface MishkatCitations {
  quran: MishkatCitation[];
  hadith: MishkatCitation[];
  khabar: MishkatCitation[];
}

export interface HomeStrings {
  instituteLabel: string;
  country: string;
  translit: string;
  enter: string;
  bismillahGloss: string;
  intentionLead: string;
  intentionSub: string;
  galleryLabel: string;
  startHereLabel: string;
  featuredFallbackTitle: string;
  featuredFallbackDescription: string;
  waysInLabel: string;
  waysInHint: string;
  recentLabel: string;
  keyTermsLabel: string;
  moreLabel: string;
  footerLine: string;
  lightVerseGloss: string;
  lightVerseCitation: string;
  prismCaption: string;
  journeyLine: string;
  journeyGloss: string;
  guideLabel: string;
  guideName: string;
  guideLine: string;
  wallLabel: string;
  wallAlt: string;
  cloakAlt: string;
  hadraAlt: string;
  zawiyaAlt: string;
  shaykhAlt: string;
  lightUponLight: string;
  cloakLine1: string;
  cloakLine2: string;
  pathways: {
    dictionary: {
      title: string;
      tag: string;
      description: string;
    };
    foundations: {
      title: string;
      tag: string;
      description: string;
    };
    articles: {
      title: string;
      tag: string;
      description: string;
    };
    books: {
      title: string;
      tag: string;
      description: string;
    };
    podcasts: {
      title: string;
      tag: string;
      description: string;
    };
    history: {
      title: string;
      tag: string;
      description: string;
    };
  };
  footerLinks: {
    dictionary: string;
    foundations: string;
    graph: string;
    tags: string;
  };
  story: {
    wayKicker: string;
    wayTitle: string;
    wayReveal: string;
    wayHadith: string;
    wayHadithSource: string;
    wayMaxim: string;
    wayMaximGloss: string;
    wayLink: string;
    shaykhKicker: string;
    shaykhTitle: string;
    shaykhPoem1: string;
    shaykhPoem2: string;
    shaykhLine: string;
    wanderTitle: string;
    wanderKicker1: string;
    wanderKicker2: string;
    wanderKicker3: string;
    wanderQuote1: string;
    wanderQuote2: string;
    wanderQuote3: string;
    khalwaLead: string;
    khalwaScript: string;
    khalwaGloss: string;
    shaykhLink: string;
    silsilaKicker: string;
    silsilaTitle: string;
    silsilaLead: string;
    silsilaMore: string;
    silsilaSeal: string;
    silsilaLink: string;
    nurKicker: string;
    nurLead: string;
    nurHadith: string;
    nurHadithSource: string;
    nurLink: string;
    wayMercy: string;
    wayHidden: string;
    shaykhReturn: string;
    shaykhDatesLabel: string;
    shaykhDates: Array<{
        year: string;
        label: string;
      }>;
    silsilaGather: string;
    nurDoor: string;
    nurWhat: string;
    nurSeen: string;
    mishkatKicker: string;
    mishkatLead: string;
    mishkatQuran: string;
    mishkatHadith: string;
    mishkatKhabar: string;
    mishkatHint: string;
    nurCouplet1: string;
    nurCouplet2: string;
    nurCoupletSource: string;
    foundationsKicker: string;
    foundationsTitle: string;
    foundationsLead: string;
    foundationsReadOn: string;
    foundations: {
      subha: {
        arabic: string;
        title: string;
        line: string;
      };
      siyaha: {
        arabic: string;
        title: string;
        line: string;
      };
      hadra: {
        arabic: string;
        title: string;
        line: string;
      };
      muraqqaa: {
        arabic: string;
        title: string;
        line: string;
      };
      ism: {
        arabic: string;
        title: string;
        line: string;
      };
      khalwa: {
        arabic: string;
        title: string;
        line: string;
      };
      sirr: {
        arabic: string;
        title: string;
        line: string;
      };
    };
    voicesKicker: string;
    voicesTitle: string;
    voicesLead: string;
    voicesLink: string;
    beginKicker: string;
    beginTitle: string;
    beginLead: string;
    beginPrimary: string;
    beginSecondary: string;
    mishkatFacetsLabel: string;
    mishkatPreviousLabel: string;
    mishkatNextLabel: string;
    mishkatCitations: MishkatCitations;
  };
}

export interface FumadocsStrings {
  displayName: string;
  search: string;
  searchNoResult: string;
  toc: string;
  tocNoHeadings: string;
  lastUpdate: string;
  chooseLanguage: string;
  nextPage: string;
  previousPage: string;
  chooseTheme: string;
  editOnGithub: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  codeBlockCopy: string;
  codeBlockCopied: string;
  accordionCopyAnchor: string;
  headingCopyAnchor: string;
  pageActionsCopyMarkdown: string;
  pageActionsOpen: string;
  pageActionsOpenGitHub: string;
  pageActionsViewMarkdown: string;
  pageActionsOpenScira: string;
  pageActionsOpenChatGPT: string;
  pageActionsOpenClaude: string;
  pageActionsOpenCursor: string;
  pageActionsOpenInLLMPrompt: string;
  bannerClose: string;
  searchOpen: string;
  searchClose: string;
  menuToggle: string;
  themeToggle: string;
  sidebarOpen: string;
  sidebarCollapse: string;
  tocInline: string;
  typeTableProp: string;
  typeTableType: string;
  typeTableDefault: string;
  typeTableParameters: string;
  typeTableReturns: string;
  notFoundTitle: string;
  notFoundDescription: string;
  notFoundLink: string;
}

export interface SiteStrings {
  locale: string;
  openInObsidian: string;
  heroTagline: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  dictionaryLabel: string;
  exploreLabel: string;
  backlinksLabel: string;
  sidenotesLabel: string;
  localGraphLabel: string;
  openGlobalGraphLabel: string;
  graphLegendPage: string;
  graphLegendTag: string;
  graphStatPages: string;
  graphStatTags: string;
  graphStatLinks: string;
  readingTimeUnit: string;
  recentNotesLabel: string;
  readerModeLabel: string;
  readerExitLabel: string;
  contentsLabel: string;
  wordsUnit: string;
  aliasesLabel: string;
  tagsAriaLabel: string;
  sectionFallback: string;
  sectionTagsIndex: string;
  sectionTag: string;
  untitledLabel: string;
  tagsFilterLabel: string;
  tagsFilterPlaceholder: string;
  tagsFilterEmpty: string;
  pageSingular: string;
  pagePlural: string;
  countOfLabel: string;
  baseNoResults: string;
  baseShowMore: string;
  baseRemainingUnit: string;
  baseFilterPlaceholder: string;
  searchPlaceholder: string;
  searchLoading: string;
  searchTypeToBegin: string;
  searchNoResults: string;
  searchHintNavigate: string;
  searchHintOpen: string;
  searchHintClose: string;
  navStartHere: string;
  navDictionary: string;
  navBooks: string;
  navPodcasts: string;
  home: HomeStrings;
  fumadocs: FumadocsStrings;
}
