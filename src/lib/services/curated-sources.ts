// ─────────────────────────────────────────────
// CURATED KNOWLEDGE BASE
// Add trusted URLs below. The AI will crawl these
// first when a user's query matches via LLM router.
// If nothing matches, it falls back to live web search.
// ─────────────────────────────────────────────

export interface CuratedSource {
  url: string;
  title: string;
}

export const CURATED_SOURCES: CuratedSource[] = [
  { url: "https://en.wikipedia.org/wiki/Isaac_Newton", title: "Isaac Newton" },
  { url: "https://en.wikipedia.org/wiki/Cristiano_Ronaldo", title: "Cristiano Ronaldo" },
  { url: "https://www.yahoo.com", title: "Yahoo" },
  { url: "https://www.globo.com", title: "Globo" },
  { url: "https://www.nytimes.com", title: "The New York Times" },
  { url: "https://www.bbc.co.uk", title: "BBC" },
  { url: "https://www.bbc.com", title: "BBC" },
  { url: "https://www.uol.com.br", title: "UOL" },
  { url: "https://www.hurriyet.com.tr", title: "Hürriyet" },
  { url: "https://www.interia.pl", title: "Interia" },
  { url: "https://www.detik.com", title: "Detik" },
  { url: "https://www.cnn.com", title: "CNN" },
  { url: "https://www.wp.pl", title: "Wirtualna Polska" },
  { url: "https://www.foxnews.com", title: "Fox News" },
  { url: "https://www.msn.com", title: "MSN" },
  { url: "https://www.theguardian.com", title: "The Guardian" },
  { url: "https://www.ndtv.com", title: "NDTV" },
  { url: "https://www.milliyet.com.tr", title: "Milliyet" },
  { url: "https://www.bild.de", title: "Bild" },
  { url: "https://www.cnnbrasil.com.br", title: "CNN Brasil" },
  { url: "https://www.aajtak.in", title: "Aaj Tak" },
  { url: "https://www.infobae.com", title: "Infobae" },
  { url: "https://www.usatoday.com", title: "USA Today" },
  { url: "https://www.aljazeera.com", title: "Al Jazeera" },
  { url: "https://www.reuters.com", title: "Reuters" },
  { url: "https://www.apnews.com", title: "Associated Press" },
  { url: "https://www.wsj.com", title: "The Wall Street Journal" },
  { url: "https://www.washingtonpost.com", title: "The Washington Post" },
  { url: "https://www.forbes.com", title: "Forbes" },
  { url: "https://www.dailymail.co.uk", title: "Daily Mail" },
  { url: "https://www.dailymail.com", title: "Daily Mail" },
  { url: "https://www.huffpost.com", title: "HuffPost" },
  { url: "https://www.abcnews.go.com", title: "ABC News" },
  { url: "https://www.nbcnews.com", title: "NBC News" },
  { url: "https://www.cbsnews.com", title: "CBS News" },
  { url: "https://www.news18.com", title: "News18" },
  { url: "https://www.indiatimes.com", title: "Times of India" },
  { url: "https://www.thesun.co.uk", title: "The Sun" },
  { url: "https://www.elpais.com", title: "El País" },
  { url: "https://www.lemonde.fr", title: "Le Monde" },
  { url: "https://www.spiegel.de", title: "Der Spiegel" },
  { url: "https://www.corriere.it", title: "Corriere della Sera" },
  { url: "https://www.repubblica.it", title: "La Repubblica" },
  { url: "https://www.asahi.com", title: "Asahi Shimbun" },
  { url: "https://www.vnexpress.net", title: "VnExpress" },
  { url: "https://www.kompas.com", title: "Kompas" },
  { url: "https://www.economist.com", title: "The Economist" },
  { url: "https://www.ft.com", title: "Financial Times" },
  { url: "https://www.bloomberg.com", title: "Bloomberg" },
  { url: "https://www.politico.com", title: "Politico" },
  { url: "https://www.politico.eu", title: "Politico Europe" },
  { url: "https://www.propublica.org", title: "ProPublica" },
  { url: "https://www.npr.org", title: "NPR" },
  { url: "https://www.rt.com", title: "RT" },
  { url: "https://www.france24.com", title: "France 24" },
  { url: "https://www.dw.com", title: "Deutsche Welle" },
  { url: "https://www.timesofindia.indiatimes.com", title: "The Times of India" },
    // Social Media & Networking
  { url: "https://www.facebook.com", title: "Facebook" },
  { url: "https://www.instagram.com", title: "Instagram" },
  { url: "https://www.reddit.com", title: "Reddit" },
  { url: "https://x.com", title: "X (formerly Twitter)" },
  { url: "https://www.whatsapp.com", title: "WhatsApp" },
  { url: "https://www.tiktok.com", title: "TikTok" },
  { url: "https://www.linkedin.com", title: "LinkedIn" },
  { url: "https://www.pinterest.com", title: "Pinterest" },
  { url: "https://vk.com", title: "VK" },
  { url: "https://discord.com", title: "Discord" },
  { url: "https://telegram.org", title: "Telegram" },
  { url: "https://ok.ru", title: "OK.ru" },
  { url: "https://www.threads.net", title: "Threads" },
  { url: "https://www.messenger.com", title: "Messenger" },
  { url: "https://www.snapchat.com", title: "Snapchat" },
  { url: "https://www.youtube.com", title: "YouTube" },
  { url: "https://weibo.com", title: "Weibo" },
  { url: "https://www.xiaohongshu.com", title: "Xiaohongshu" },
  { url: "https://www.douyin.com", title: "Douyin" },
  { url: "https://www.zhihu.com", title: "Zhihu" },
  { url: "https://www.tumblr.com", title: "Tumblr" },
  { url: "https://bsky.app", title: "Bluesky" },
  { url: "https://www.patreon.com", title: "Patreon" },
  { url: "https://medium.com", title: "Medium" },
  { url: "https://www.quora.com", title: "Quora" },
  { url: "https://nextdoor.com", title: "Nextdoor" },
  { url: "https://www.twitch.tv", title: "Twitch" },
  { url: "https://vimeo.com", title: "Vimeo" },
  { url: "https://www.flickr.com", title: "Flickr" },
  { url: "https://www.meetup.com", title: "Meetup" },
  { url: "https://line.me", title: "LINE" },
  { url: "https://www.wechat.com", title: "WeChat" },
  { url: "https://www.qq.com", title: "QQ" },
  { url: "https://qzone.qq.com", title: "Qzone" },
  { url: "https://www.kuaishou.com", title: "Kuaishou" },
  { url: "https://www.bilibili.com", title: "Bilibili" },
  { url: "https://sharechat.com", title: "ShareChat" },
  { url: "https://rumble.com", title: "Rumble" },
  { url: "https://mastodon.social", title: "Mastodon" },
  { url: "https://signal.org", title: "Signal" },
  { url: "https://www.clubhouse.com", title: "Clubhouse" },
  { url: "https://myspace.com", title: "Myspace" },
  { url: "https://www.tagged.com", title: "Tagged" },
  { url: "https://www.hi5.com", title: "Hi5" },
  { url: "https://bebo.com", title: "Bebo" },
  { url: "https://www.renren.com", title: "Renren" },
  { url: "https://hyves.nl", title: "Hyves" },
  { url: "https://www.xing.com", title: "XING" },
  { url: "https://www.viadeo.com", title: "Viadeo" },
  { url: "https://mix.com", title: "Mix" },
  { url: "https://delicious.com", title: "Delicious" },
  { url: "https://digg.com", title: "Digg" },
  { url: "https://slashdot.org", title: "Slashdot" },
  { url: "https://news.ycombinator.com", title: "Hacker News" },
  { url: "https://steemit.com", title: "Steemit" },
  { url: "https://www.minds.com", title: "Minds" },
  { url: "https://gab.com", title: "Gab" },
  { url: "https://truthsocial.com", title: "Truth Social" },
  { url: "https://gettr.com", title: "GETTR" },
  { url: "https://parler.com", title: "Parler" },
  { url: "https://locals.com", title: "Locals" },
  { url: "https://onlyfans.com", title: "OnlyFans" },
  { url: "https://fansly.com", title: "Fansly" },
  { url: "https://substack.com", title: "Substack" },
  { url: "https://www.deviantart.com", title: "DeviantArt" },
  { url: "https://soundcloud.com", title: "SoundCloud" },
  { url: "https://bandcamp.com", title: "Bandcamp" },
  { url: "https://www.mixcloud.com", title: "Mixcloud" },
  { url: "https://dribbble.com", title: "Dribbble" },
  { url: "https://www.behance.net", title: "Behance" },
  { url: "https://github.com", title: "GitHub" },
  { url: "https://stackoverflow.com", title: "Stack Overflow" },
  { url: "https://www.goodreads.com", title: "Goodreads" },
  { url: "https://letterboxd.com", title: "Letterboxd" },
  { url: "https://www.myfitnesspal.com", title: "MyFitnessPal" },
  { url: "https://www.strava.com", title: "Strava" },
  { url: "https://www.alltrails.com", title: "AllTrails" },
  { url: "https://www.ravelry.com", title: "Ravelry" },
  { url: "https://www.etsy.com", title: "Etsy" },
  { url: "https://www.airbnb.com", title: "Airbnb" },
  { url: "https://www.roblox.com", title: "Roblox" },
  { url: "https://www.epicgames.com", title: "Fortnite" },
  { url: "https://steamcommunity.com", title: "Steam Community" },
  { url: "https://www.naver.com", title: "Naver" },
  { url: "https://www.cyworld.com", title: "Cyworld" },
  { url: "https://mixi.jp", title: "Mixi" },
  { url: "https://ameblo.jp", title: "Ameba" },
  { url: "https://www.skyrock.com", title: "Skyrock" },
  { url: "https://nasza-klasa.pl", title: "Nasza Klasa" },
  { url: "https://roposo.com", title: "Roposo" },
  { url: "https://chingari.io", title: "Chingari" },
  { url: "https://www.4chan.org", title: "4chan" },
  { url: "https://8kun.top", title: "8kun" },
  { url: "https://www.somethingawful.com", title: "Something Awful" },
  { url: "https://www.gaiaonline.com", title: "Gaia Online" },
  { url: "https://www.fanfiction.net", title: "FanFiction.net" },
  { url: "https://www.researchgate.net", title: "ResearchGate" },
  { url: "https://www.academia.edu", title: "Academia.edu" },
  { url: "https://www.doximity.com", title: "Doximity" },
  { url: "https://wellfound.com", title: "Wellfound (AngelList)" },
  { url: "https://tinder.com", title: "Tinder" },
  { url: "https://bumble.com", title: "Bumble" },
  { url: "https://hinge.co", title: "Hinge" },
  { url: "https://www.okcupid.com", title: "OkCupid" },
  { url: "https://www.match.com", title: "Match.com" },
  { url: "https://www.plentyoffish.com", title: "Plenty of Fish" },
  { url: "https://www.grindr.com", title: "Grindr" },
  { url: "https://weareher.com", title: "HER" },
  { url: "https://500px.com", title: "500px" },
  { url: "https://www.eyeem.com", title: "EyeEm" },
  { url: "https://www.couchsurfing.com", title: "Couchsurfing" },
  { url: "https://www.wattpad.com", title: "Wattpad" },
  { url: "https://www.fanpop.com", title: "Fanpop" },
  { url: "https://www.livejournal.com", title: "LiveJournal" },
    // Search Engines & Information Portals
  // Top Global
  { url: "https://www.google.com", title: "Google" },
  { url: "https://www.bing.com", title: "Bing" },
  { url: "https://search.yahoo.com", title: "Yahoo Search" },
  { url: "https://www.baidu.com", title: "Baidu" },
  { url: "https://yandex.ru", title: "Yandex" },
  { url: "https://duckduckgo.com", title: "DuckDuckGo" },
  { url: "https://www.wikipedia.org", title: "Wikipedia" },
  { url: "https://www.ecosia.org", title: "Ecosia" },
  { url: "https://brave.com/search", title: "Brave Search" },
  { url: "https://www.perplexity.ai", title: "Perplexity" },

  // Other Major
  { url: "https://www.naver.com", title: "Naver" },
  { url: "https://www.daum.net", title: "Daum" },
  { url: "https://www.sogou.com", title: "Sogou" },
  { url: "https://www.seznam.cz", title: "Seznam" },
  { url: "https://www.qwant.com", title: "Qwant" },
  { url: "https://www.startpage.com", title: "Startpage" },
  { url: "https://swisscows.com", title: "Swisscows" },
  { url: "https://mojeek.com", title: "Mojeek" },
  { url: "https://you.com", title: "You.com" },
  { url: "https://yep.com", title: "Yep" },
  { url: "https://chatgpt.com", title: "ChatGPT" },
  { url: "https://archive.org", title: "Internet Archive" },

  // Information Portals & Directories
  { url: "https://www.yahoo.com", title: "Yahoo" },
  { url: "https://www.msn.com", title: "MSN" },
  { url: "https://www.aol.com", title: "AOL" },
  { url: "https://www.lycos.com", title: "Lycos" },
  { url: "https://www.excite.com", title: "Excite" },
  { url: "https://www.ask.com", title: "Ask.com" },

  // Metasearch
  { url: "https://www.dogpile.com", title: "Dogpile" },
  { url: "https://www.metacrawler.com", title: "MetaCrawler" },
  { url: "https://www.webcrawler.com", title: "WebCrawler" },

  // News
  { url: "https://news.google.com", title: "Google News" },
  { url: "https://www.bing.com/news", title: "Bing News" },

  // Shopping
  { url: "https://www.google.com/shopping", title: "Google Shopping" },
  { url: "https://www.amazon.com", title: "Amazon" },
  { url: "https://www.ebay.com", title: "eBay" },

  // Academic
  { url: "https://scholar.google.com", title: "Google Scholar" },
  { url: "https://pubmed.ncbi.nlm.nih.gov", title: "PubMed" },
  { url: "https://www.researchgate.net", title: "ResearchGate" },
  { url: "https://www.semanticscholar.org", title: "Semantic Scholar" },
  { url: "https://www.base-search.net", title: "BASE" },
  { url: "https://core.ac.uk", title: "CORE" },
  { url: "https://doaj.org", title: "Directory of Open Access Journals" },

  // Images
  { url: "https://images.google.com", title: "Google Images" },
  { url: "https://tineye.com", title: "TinEye" },
  { url: "https://yandex.com/images", title: "Yandex Images" },
  { url: "https://www.bing.com/images", title: "Bing Images" },

  // Maps
  { url: "https://maps.google.com", title: "Google Maps" },
  { url: "https://www.bing.com/maps", title: "Bing Maps" },
  { url: "https://www.here.com", title: "HERE" },
  { url: "https://www.openstreetmap.org", title: "OpenStreetMap" },

  // Jobs
  { url: "https://www.indeed.com", title: "Indeed" },
  { url: "https://www.linkedin.com/jobs", title: "LinkedIn Jobs" },
  { url: "https://www.glassdoor.com", title: "Glassdoor" },
  { url: "https://www.monster.com", title: "Monster" },
  { url: "https://www.careerbuilder.com", title: "CareerBuilder" },
  { url: "https://www.dice.com", title: "Dice" },

  // Real Estate
  { url: "https://www.zillow.com", title: "Zillow" },
  { url: "https://www.realtor.com", title: "Realtor.com" },
  { url: "https://www.rightmove.co.uk", title: "Rightmove" },

  // Travel
  { url: "https://www.tripadvisor.com", title: "Tripadvisor" },
  { url: "https://www.booking.com", title: "Booking.com" },
  { url: "https://www.kayak.com", title: "Kayak" },
  { url: "https://www.expedia.com", title: "Expedia" },
  { url: "https://www.trip.com", title: "Trip.com" },
  { url: "https://www.airbnb.com", title: "Airbnb" },
  { url: "https://www.opentable.com", title: "OpenTable" },

  // Health
  { url: "https://www.webmd.com", title: "WebMD" },
  { url: "https://www.mayoclinic.org", title: "Mayo Clinic" },
  { url: "https://www.nih.gov", title: "National Institutes of Health" },
  { url: "https://www.cdc.gov", title: "CDC" },
  { url: "https://www.who.int", title: "World Health Organization" },

  // Legal/Finance
  { url: "https://www.sec.gov/edgar", title: "SEC EDGAR" },
  { url: "https://www.bloomberg.com", title: "Bloomberg" },
  { url: "https://www.reuters.com", title: "Reuters" },
  { url: "https://finance.yahoo.com", title: "Yahoo Finance" },
  { url: "https://www.marketwatch.com", title: "MarketWatch" },

  // Code/Tech
  { url: "https://github.com", title: "GitHub" },
  { url: "https://stackoverflow.com", title: "Stack Overflow" },
  { url: "https://www.npmjs.com", title: "npm" },
  { url: "https://pypi.org", title: "PyPI" },
  { url: "https://crates.io", title: "crates.io" },
  { url: "https://packagist.org", title: "Packagist" },

  // Books
  { url: "https://books.google.com", title: "Google Books" },
  { url: "https://www.goodreads.com", title: "Goodreads" },
  { url: "https://www.amazon.com/kindle", title: "Amazon Kindle" },

  // Music
  { url: "https://soundcloud.com", title: "SoundCloud" },
  { url: "https://open.spotify.com", title: "Spotify" },
  { url: "https://www.discogs.com", title: "Discogs" },
  { url: "https://www.allmusic.com", title: "AllMusic" },

  // Movies/TV
  { url: "https://www.imdb.com", title: "IMDb" },
  { url: "https://www.rottentomatoes.com", title: "Rotten Tomatoes" },

  // Local/Reviews
  { url: "https://www.yelp.com", title: "Yelp" },

  // Design/Portfolio
  { url: "https://dribbble.com", title: "Dribbble" },
  { url: "https://www.behance.net", title: "Behance" },
  { url: "https://500px.com", title: "500px" },
  { url: "https://www.flickr.com", title: "Flickr" },
  { url: "https://www.deviantart.com", title: "DeviantArt" },
  { url: "https://www.artstation.com", title: "ArtStation" },

  // Tech News/Reviews
  { url: "https://www.cnet.com", title: "CNET" },
  { url: "https://techcrunch.com", title: "TechCrunch" },
  { url: "https://www.wired.com", title: "Wired" },
  { url: "https://www.theverge.com", title: "The Verge" },
  { url: "https://www.engadget.com", title: "Engadget" },
  { url: "https://arstechnica.com", title: "Ars Technica" },
  { url: "https://slashdot.org", title: "Slashdot" },
  { url: "https://news.ycombinator.com", title: "Hacker News" },
  { url: "https://www.producthunt.com", title: "Product Hunt" },
  { url: "https://betalist.com", title: "BetaList" },
  { url: "https://www.crunchbase.com", title: "Crunchbase" },
  { url: "https://wellfound.com", title: "Wellfound (AngelList)" },

  // Data/Open Data
  { url: "https://www.kaggle.com", title: "Kaggle" },
  { url: "https://data.gov", title: "Data.gov" },
  { url: "https://data.europa.eu", title: "European Data Portal" },
  { url: "https://commoncrawl.org", title: "Common Crawl" },

  // Analytics/SEO
  { url: "https://www.similarweb.com", title: "Similarweb" },
  { url: "https://www.semrush.com", title: "Semrush" },
  { url: "https://ahrefs.com", title: "Ahrefs" },
  { url: "https://moz.com", title: "Moz" },
  { url: "https://majestic.com", title: "Majestic" },

  // Regional/National (new ones, skipping duplicates)
  { url: "https://gigablast.com", title: "Gigablast" },
  { url: "https://rambler.ru", title: "Rambler" },
  { url: "https://goo.ne.jp", title: "Goo" },
  { url: "https://www.yahoo.co.jp", title: "Yahoo Japan" },
  { url: "https://petalsearch.com", title: "Petal Search" },
  { url: "https://haosou.com", title: "360 Search" },
  { url: "https://www.shenma.com", title: "Shenma" },

  // Additional metasearch/aggregators
  { url: "https://ixquick.com", title: "Ixquick/Startpage" },
  { url: "https://search.aol.com", title: "AOL Search" },
  { url: "https://www.search.com", title: "Search.com" },
  { url: "https://www.infospace.com", title: "InfoSpace" },
  { url: "https://www.wolframalpha.com", title: "Wolfram Alpha" },
  { url: "https://yippy.com", title: "Yippy" },
  { url: "https://boardreader.com", title: "Boardreader" },
  { url: "https://social-searcher.com", title: "Social Searcher" },
  { url: "https://keyhole.co", title: "Keyhole" },
  { url: "https://www.talkwalker.com", title: "Talkwalker" },
  { url: "https://www.meltwater.com", title: "Meltwater" },
  { url: "https://www.brandwatch.com", title: "Brandwatch" },
    // Search Engines & Information Portals
  // Top Global
  { url: "https://www.google.com", title: "Google" },
  { url: "https://www.bing.com", title: "Bing" },
  { url: "https://search.yahoo.com", title: "Yahoo Search" },
  { url: "https://www.baidu.com", title: "Baidu" },
  { url: "https://yandex.ru", title: "Yandex" },
  { url: "https://duckduckgo.com", title: "DuckDuckGo" },
  { url: "https://www.wikipedia.org", title: "Wikipedia" },
  { url: "https://www.ecosia.org", title: "Ecosia" },
  { url: "https://brave.com/search", title: "Brave Search" },
  { url: "https://www.perplexity.ai", title: "Perplexity" },

  // Other Major
  { url: "https://www.naver.com", title: "Naver" },
  { url: "https://www.daum.net", title: "Daum" },
  { url: "https://www.sogou.com", title: "Sogou" },
  { url: "https://www.seznam.cz", title: "Seznam" },
  { url: "https://www.qwant.com", title: "Qwant" },
  { url: "https://www.startpage.com", title: "Startpage" },
  { url: "https://swisscows.com", title: "Swisscows" },
  { url: "https://mojeek.com", title: "Mojeek" },
  { url: "https://you.com", title: "You.com" },
  { url: "https://yep.com", title: "Yep" },
  { url: "https://chatgpt.com", title: "ChatGPT" },
  { url: "https://archive.org", title: "Internet Archive" },

  // Information Portals & Directories
  { url: "https://www.yahoo.com", title: "Yahoo" },
  { url: "https://www.msn.com", title: "MSN" },
  { url: "https://www.aol.com", title: "AOL" },
  { url: "https://www.lycos.com", title: "Lycos" },
  { url: "https://www.excite.com", title: "Excite" },
  { url: "https://www.ask.com", title: "Ask.com" },

  // Metasearch
  { url: "https://www.dogpile.com", title: "Dogpile" },
  { url: "https://www.metacrawler.com", title: "MetaCrawler" },
  { url: "https://www.webcrawler.com", title: "WebCrawler" },

  // Vertical/Specialized: News
  { url: "https://news.google.com", title: "Google News" },
  { url: "https://www.bing.com/news", title: "Bing News" },

  // Shopping
  { url: "https://shopping.google.com", title: "Google Shopping" },
  { url: "https://www.amazon.com", title: "Amazon Search" },
  { url: "https://www.ebay.com", title: "eBay" },

  // Academic
  { url: "https://scholar.google.com", title: "Google Scholar" },
  { url: "https://pubmed.ncbi.nlm.nih.gov", title: "PubMed" },
  { url: "https://www.researchgate.net", title: "ResearchGate" },
  { url: "https://www.semanticscholar.org", title: "Semantic Scholar" },
  { url: "https://www.base-search.net", title: "BASE" },
  { url: "https://core.ac.uk", title: "CORE" },

  // Images
  { url: "https://images.google.com", title: "Google Images" },
  { url: "https://tineye.com", title: "TinEye" },
  { url: "https://yandex.com/images", title: "Yandex Images" },
  { url: "https://www.bing.com/images", title: "Bing Images" },

  // Maps
  { url: "https://maps.google.com", title: "Google Maps" },
  { url: "https://www.bing.com/maps", title: "Bing Maps" },
  { url: "https://www.here.com", title: "HERE Maps" },
  { url: "https://www.openstreetmap.org", title: "OpenStreetMap" },

  // Jobs
  { url: "https://www.indeed.com", title: "Indeed" },
  { url: "https://www.linkedin.com/jobs", title: "LinkedIn Jobs" },
  { url: "https://www.glassdoor.com", title: "Glassdoor" },

  // Real Estate
  { url: "https://www.zillow.com", title: "Zillow" },
  { url: "https://www.rightmove.co.uk", title: "Rightmove" },

  // Travel
  { url: "https://www.tripadvisor.com", title: "Tripadvisor" },
  { url: "https://www.kayak.com", title: "Kayak" },
  { url: "https://www.booking.com", title: "Booking.com Search" },

  // Health
  { url: "https://www.webmd.com", title: "WebMD" },
  { url: "https://www.mayoclinic.org", title: "Mayo Clinic" },
  { url: "https://www.nih.gov", title: "NIH" },

  // Legal/Finance
  { url: "https://www.sec.gov/edgar", title: "SEC EDGAR" },
  { url: "https://www.bloomberg.com", title: "Bloomberg" },
  { url: "https://www.reuters.com", title: "Reuters" },

  // Code/Tech
  { url: "https://github.com", title: "GitHub" },
  { url: "https://stackoverflow.com", title: "Stack Overflow" },
  { url: "https://www.npmjs.com", title: "npm" },

  // Books
  { url: "https://books.google.com", title: "Google Books" },
  { url: "https://www.goodreads.com", title: "Goodreads" },
  { url: "https://www.amazon.com/kindle", title: "Amazon Kindle" },

  // Music
  { url: "https://soundcloud.com", title: "SoundCloud Search" },
  { url: "https://open.spotify.com", title: "Spotify Search" },

  // Regional/National (new)
  { url: "https://gigablast.com", title: "Gigablast" },
  { url: "https://mojeek.com", title: "Mojeek" },
  { url: "https://rambler.ru", title: "Rambler" },
  { url: "https://goo.ne.jp", title: "Goo" },
  { url: "https://www.yahoo.co.jp", title: "Yahoo Japan" },
  { url: "https://petalsearch.com", title: "Petal Search" },
  { url: "https://haosou.com", title: "360 Search (Haosou)" },
  { url: "https://www.shenma.com", title: "Shenma" },

  // Additional Aggregators & Tools
  { url: "https://ixquick.com", title: "Ixquick (Startpage)" },
  { url: "https://search.aol.com", title: "AOL Search" },
  { url: "https://www.search.com", title: "Search.com" },
  { url: "https://www.infospace.com", title: "InfoSpace" },
  { url: "https://www.wolframalpha.com", title: "Wolfram Alpha" },
  { url: "https://yippy.com", title: "Yippy" },
  { url: "https://boardreader.com", title: "Boardreader" },
  { url: "https://social-searcher.com", title: "Social Searcher" },
  { url: "https://keyhole.co", title: "Keyhole" },
  { url: "https://www.talkwalker.com", title: "Talkwalker" },
  { url: "https://www.meltwater.com", title: "Meltwater" },
  { url: "https://www.brandwatch.com", title: "Brandwatch" },
  { url: "https://www.monster.com", title: "Monster" },
  { url: "https://www.careerbuilder.com", title: "CareerBuilder" },
  { url: "https://www.dice.com", title: "Dice" },
  { url: "https://doaj.org", title: "DOAJ" },
  { url: "https://www.realtor.com", title: "Realtor.com" },
  { url: "https://www.expedia.com", title: "Expedia" },
  { url: "https://www.cdc.gov", title: "CDC" },
  { url: "https://www.who.int", title: "WHO" },
  { url: "https://finance.yahoo.com", title: "Yahoo Finance" },
  { url: "https://www.marketwatch.com", title: "MarketWatch" },
  { url: "https://pypi.org", title: "PyPI" },
  { url: "https://crates.io", title: "crates.io" },
  { url: "https://packagist.org", title: "Packagist" },
  { url: "https://www.imdb.com", title: "IMDb" },
  { url: "https://www.rottentomatoes.com", title: "Rotten Tomatoes" },
  { url: "https://www.discogs.com", title: "Discogs" },
  { url: "https://www.allmusic.com", title: "AllMusic" },
  { url: "https://www.yelp.com", title: "Yelp" },
  { url: "https://www.trip.com", title: "Trip.com" },
  { url: "https://www.airbnb.com", title: "Airbnb Search" },
  { url: "https://www.opentable.com", title: "OpenTable" },
  { url: "https://dribbble.com", title: "Dribbble" },
  { url: "https://www.behance.net", title: "Behance" },
  { url: "https://500px.com", title: "500px" },
  { url: "https://www.flickr.com", title: "Flickr" },
  { url: "https://www.deviantart.com", title: "DeviantArt" },
  { url: "https://www.artstation.com", title: "ArtStation" },
  { url: "https://www.cnet.com", title: "CNET" },
  { url: "https://techcrunch.com", title: "TechCrunch" },
  { url: "https://www.wired.com", title: "Wired" },
  { url: "https://www.theverge.com", title: "The Verge" },
  { url: "https://www.engadget.com", title: "Engadget" },
  { url: "https://arstechnica.com", title: "Ars Technica" },
  { url: "https://slashdot.org", title: "Slashdot" },
  { url: "https://news.ycombinator.com", title: "Hacker News" },
  { url: "https://www.producthunt.com", title: "Product Hunt" },
  { url: "https://betalist.com", title: "BetaList" },
  { url: "https://www.crunchbase.com", title: "Crunchbase" },
  { url: "https://wellfound.com", title: "Wellfound (AngelList)" },
  { url: "https://www.kaggle.com", title: "Kaggle" },
  { url: "https://data.gov", title: "Data.gov" },
  { url: "https://data.europa.eu", title: "European Data Portal" },
  { url: "https://commoncrawl.org", title: "Common Crawl" },
  { url: "https://alexa.com", title: "Alexa (historical)" },
  { url: "https://www.similarweb.com", title: "Similarweb" },
  { url: "https://www.semrush.com", title: "Semrush" },
  { url: "https://ahrefs.com", title: "Ahrefs" },
  { url: "https://moz.com", title: "Moz" },
  { url: "https://majestic.com", title: "Majestic" },
    // E-commerce & Retail
  // Major Marketplaces & Retailers
  { url: "https://www.amazon.com", title: "Amazon" },
  { url: "https://www.temu.com", title: "Temu" },
  { url: "https://www.ebay.com", title: "eBay" },
  { url: "https://www.aliexpress.com", title: "AliExpress" },
  { url: "https://www.walmart.com", title: "Walmart" },
  { url: "https://www.etsy.com", title: "Etsy" },
  { url: "https://www.shopify.com", title: "Shopify" },
  { url: "https://www.ozon.ru", title: "Ozon" },
  { url: "https://www.flipkart.com", title: "Flipkart" },
  { url: "https://www.jd.com", title: "JD.com" },
  { url: "https://www.taobao.com", title: "Taobao" },
  { url: "https://www.tmall.com", title: "Tmall" },
  { url: "https://shopee.com", title: "Shopee" },
  { url: "https://www.mercadolibre.com", title: "Mercado Libre" },
  { url: "https://www.zalando.com", title: "Zalando" },
  { url: "https://www.asos.com", title: "ASOS" },
  { url: "https://www.shein.com", title: "Shein" },
  { url: "https://www.target.com", title: "Target" },
  { url: "https://www.bestbuy.com", title: "Best Buy" },
  { url: "https://www.homedepot.com", title: "Home Depot" },
  { url: "https://www.lowes.com", title: "Lowe's" },
  { url: "https://www.costco.com", title: "Costco" },
  { url: "https://www.macys.com", title: "Macy's" },
  { url: "https://www.nordstrom.com", title: "Nordstrom" },
  { url: "https://www.kohls.com", title: "Kohl's" },
  { url: "https://www.gap.com", title: "Gap" },
  { url: "https://www.oldnavy.com", title: "Old Navy" },
  { url: "https://www.bananarepublic.com", title: "Banana Republic" },
  { url: "https://www.zara.com", title: "Zara" },
  { url: "https://www.hm.com", title: "H&M" },
  { url: "https://www.uniqlo.com", title: "Uniqlo" },
  { url: "https://www.nike.com", title: "Nike" },
  { url: "https://www.adidas.com", title: "Adidas" },
  { url: "https://www.puma.com", title: "Puma" },
  { url: "https://www.underarmour.com", title: "Under Armour" },
  { url: "https://www.lululemon.com", title: "Lululemon" },
  { url: "https://www.victoriassecret.com", title: "Victoria's Secret" },
  { url: "https://www.sephora.com", title: "Sephora" },
  { url: "https://www.ulta.com", title: "Ulta Beauty" },
  { url: "https://www.chewy.com", title: "Chewy" },
  { url: "https://www.wayfair.com", title: "Wayfair" },
  { url: "https://www.revolve.com", title: "Revolve" },
  { url: "https://www.fashionnova.com", title: "Fashion Nova" },
  { url: "https://www.prettylittlething.com", title: "PrettyLittleThing" },
  { url: "https://www.boohoo.com", title: "Boohoo" },
  { url: "https://www.missguided.com", title: "Missguided" },
  { url: "https://www.romwe.com", title: "Romwe" },
  { url: "https://www.forever21.com", title: "Forever 21" },
  { url: "https://www.urbanoutfitters.com", title: "Urban Outfitters" },
  { url: "https://www.anthropologie.com", title: "Anthropologie" },
  { url: "https://www.freepeople.com", title: "Free People" },
  { url: "https://www.dsw.com", title: "DSW" },
  { url: "https://www.footlocker.com", title: "Foot Locker" },
  { url: "https://www.dickssportinggoods.com", title: "Dick's Sporting Goods" },
  { url: "https://www.rei.com", title: "REI" },
  { url: "https://www.dyson.com", title: "Dyson" },
  { url: "https://www.williams-sonoma.com", title: "Williams Sonoma" },
  { url: "https://www.crateandbarrel.com", title: "Crate & Barrel" },
  { url: "https://www.potterybarn.com", title: "Pottery Barn" },
  { url: "https://www.westelm.com", title: "West Elm" },
  { url: "https://www.ikea.com", title: "IKEA" },
  { url: "https://www.apple.com", title: "Apple" },
  { url: "https://www.samsung.com", title: "Samsung" },
  { url: "https://www.dell.com", title: "Dell" },
  { url: "https://www.hp.com", title: "HP" },
  { url: "https://www.lenovo.com", title: "Lenovo" },
  { url: "https://www.microsoft.com", title: "Microsoft Store" },
  { url: "https://www.sony.com", title: "Sony" },
  { url: "https://www.bose.com", title: "Bose" },
  { url: "https://www.harman.com", title: "Harman" },
  { url: "https://www.newegg.com", title: "Newegg" },
  { url: "https://www.microcenter.com", title: "Micro Center" },
  { url: "https://www.overstock.com", title: "Overstock" },
  { url: "https://www.qvc.com", title: "QVC" },
  { url: "https://www.hsn.com", title: "HSN" },
  { url: "https://www.groupon.com", title: "Groupon" },
  { url: "https://www.wish.com", title: "Wish" },
  { url: "https://www.banggood.com", title: "Banggood" },
  { url: "https://www.gearbest.com", title: "Gearbest" },
  { url: "https://www.lightinthebox.com", title: "LightInTheBox" },
  // Regional marketplaces
  { url: "https://www.tokopedia.com", title: "Tokopedia" },
  { url: "https://www.lazada.com", title: "Lazada" },
  { url: "https://www.blibli.com", title: "Blibli" },
  { url: "https://www.otto.de", title: "Otto" },
  { url: "https://www.bol.com", title: "Bol.com" },
  { url: "https://www.fnac.com", title: "Fnac" },
  { url: "https://www.cdiscount.com", title: "Cdiscount" },
  { url: "https://www.rakuten.com", title: "Rakuten" },
  { url: "https://shopping.yahoo.co.jp", title: "Yahoo Japan Shopping" },
  { url: "https://www.noon.com", title: "Noon" },
  { url: "https://www.jumia.com", title: "Jumia" },
  { url: "https://www.takealot.com", title: "Takealot" },
  { url: "https://www.konga.com", title: "Konga" },
  // E-commerce platforms
  { url: "https://www.shopify.com", title: "Shopify" },
  { url: "https://woocommerce.com", title: "WooCommerce" },
  { url: "https://www.bigcommerce.com", title: "BigCommerce" },
  { url: "https://magento.com", title: "Magento" },
  { url: "https://www.squarespace.com", title: "Squarespace Commerce" },
  { url: "https://www.wix.com", title: "Wix eCommerce" },
  { url: "https://www.opencart.com", title: "OpenCart" },
  { url: "https://www.prestashop.com", title: "PrestaShop" },
  { url: "https://www.volusion.com", title: "Volusion" },
  { url: "https://www.weebly.com", title: "Weebly" },
  // Grocery delivery
  { url: "https://www.instacart.com", title: "Instacart" },
  { url: "https://www.peapod.com", title: "Peapod" },
  // Luxury fashion
  { url: "https://www.farfetch.com", title: "Farfetch" },
  { url: "https://www.net-a-porter.com", title: "Net-a-Porter" },
  // Notable Shopify stores (examples)
  { url: "https://www.gymshark.com", title: "Gymshark" },
  { url: "https://www.allbirds.com", title: "Allbirds" },
  { url: "https://www.everlane.com", title: "Everlane" },
  { url: "https://www.reformation.com", title: "Reformation" },
  { url: "https://www.whop.com", title: "Whoop" },
  { url: "https://www.chubbies.com", title: "Chubbies" },
  { url: "https://www.hiutdenim.com", title: "Hiut Denim" },
  { url: "https://www.portlandleather.com", title: "Portland Leather Goods" },
  { url: "https://www.mvmt.com", title: "MVMT" },
  { url: "https://www.warbyparker.com", title: "Warby Parker" },
  { url: "https://www.glassesusa.com", title: "GlassesUSA" },
  { url: "https://www.indochino.com", title: "Indochino" },
  { url: "https://www.bonobos.com", title: "Bonobos" },
  { url: "https://www.tommyjohn.com", title: "Tommy John" },
  { url: "https://www.meundies.com", title: "MeUndies" },
  { url: "https://www.bombas.com", title: "Bombas" },
  { url: "https://www.trueclassictees.com", title: "True Classic Tees" },
  { url: "https://www.untuckit.com", title: "Untuckit" },
  { url: "https://www.huckberry.com", title: "Huckberry" },
  { url: "https://www.duluthtrading.com", title: "Duluth Trading" },
  { url: "https://www.filson.com", title: "Filson" },
  { url: "https://www.patagonia.com", title: "Patagonia" },
  { url: "https://www.thenorthface.com", title: "The North Face" },
  { url: "https://www.ross-simons.com", title: "Ross-Simons" },
  // Beauty/Skincare
  { url: "https://www.glossier.com", title: "Glossier" },
  { url: "https://theordinary.com", title: "The Ordinary" },
  { url: "https://www.fentybeauty.com", title: "Fenty Beauty" },
  { url: "https://www.kyliecosmetics.com", title: "Kylie Cosmetics" },
  { url: "https://www.colourpop.com", title: "ColourPop" },
  { url: "https://www.drunkelephant.com", title: "Drunk Elephant" },
  { url: "https://www.laneige.com", title: "Laneige" },
  { url: "https://www.glowrecipe.com", title: "Glow Recipe" },
  { url: "https://www.summerfridays.com", title: "Summer Fridays" },
  { url: "https://www.meritbeauty.com", title: "Merit Beauty" },
  { url: "https://www.kosas.com", title: "Kosas" },
  { url: "https://www.iliabeauty.com", title: "Ilia Beauty" },
  { url: "https://www.tower28beauty.com", title: "Tower 28" },
  { url: "https://www.rhodeskin.com", title: "Rhode Skin" },
  { url: "https://www.soldejaneiro.com", title: "Sol de Janeiro" },
  // Home/Decor/Furniture
  { url: "https://www.article.com", title: "Article" },
  { url: "https://www.burrow.com", title: "Burrow" },
  { url: "https://www.helixsleep.com", title: "Helix Sleep" },
  { url: "https://www.purple.com", title: "Purple" },
  { url: "https://www.casper.com", title: "Casper" },
  { url: "https://www.brooklinen.com", title: "Brooklinen" },
  { url: "https://www.parachutehome.com", title: "Parachute Home" },
  { url: "https://www.bollandbranch.com", title: "Boll & Branch" },
  { url: "https://www.cozyearth.com", title: "Cozy Earth" },
  { url: "https://www.saatva.com", title: "Saatva" },
  { url: "https://www.joybird.com", title: "Joybird" },
  { url: "https://www.interiordefine.com", title: "Interior Define" },
  // Food/Health/Subscription
  { url: "https://www.blueapron.com", title: "Blue Apron" },
  { url: "https://www.hellofresh.com", title: "HelloFresh" },
  { url: "https://www.factor75.com", title: "Factor" },
  { url: "https://www.daily-harvest.com", title: "Daily Harvest" },
  { url: "https://www.thrivemarket.com", title: "Thrive Market" },
  { url: "https://www.imperfectfoods.com", title: "Imperfect Foods" },
  { url: "https://www.graza.com", title: "Graza" },
  { url: "https://www.firebellytea.com", title: "Firebelly Tea" },
  { url: "https://www.olipop.com", title: "Olipop" },
  { url: "https://www.liquiddeath.com", title: "Liquid Death" },
  { url: "https://www.athleticgreens.com", title: "AG1" },
  { url: "https://www.seed.com", title: "Seed" },
  // Other notable Shopify stores
  { url: "https://www.away.com", title: "Away" },
  { url: "https://www.rothys.com", title: "Rothy's" },
  { url: "https://www.tieks.com", title: "Tieks" },
  { url: "https://www.mejuri.com", title: "Mejuri" },
  { url: "https://www.catbird.com", title: "Catbird" },
  { url: "https://www.auratenewyork.com", title: "Aurate" },
  { url: "https://www.brilliantearth.com", title: "Brilliant Earth" },
  { url: "https://www.bookofthemonth.com", title: "Book of the Month" },
  { url: "https://www.fabfitfun.com", title: "FabFitFun" },
  { url: "https://www.ipsy.com", title: "Ipsy" },
  { url: "https://www.boxycharm.com", title: "BoxyCharm" },
  { url: "https://www.lootcrate.com", title: "Loot Crate" },
  { url: "https://www.birchbox.com", title: "Birchbox" },
  { url: "https://www.dollarshaveclub.com", title: "Dollar Shave Club" },
  { url: "https://www.harrys.com", title: "Harry's" },
  { url: "https://www.manscaped.com", title: "Manscaped" },
  { url: "https://www.nativecos.com", title: "Native" },
  { url: "https://www.mybillie.com", title: "Billie" },
  { url: "https://www.prose.com", title: "Prose" },
  { url: "https://www.functionofbeauty.com", title: "Function of Beauty" },
  { url: "https://www.curology.com", title: "Curology" },
  { url: "https://www.peakdesign.com", title: "Peak Design" },
  { url: "https://www.anker.com", title: "Anker" },
  { url: "https://www.dji.com", title: "DJI" },
  { url: "https://www.oculus.com", title: "Oculus" },
    // Banks, Fintech & Finance
  // Major Commercial & Retail Banks
  { url: "https://www.chase.com", title: "Chase (JPMorgan Chase)" },
  { url: "https://www.bankofamerica.com", title: "Bank of America" },
  { url: "https://www.wellsfargo.com", title: "Wells Fargo" },
  { url: "https://www.citi.com", title: "Citigroup" },
  { url: "https://www.usbank.com", title: "U.S. Bank" },
  { url: "https://www.pnc.com", title: "PNC" },
  { url: "https://www.capitalone.com", title: "Capital One" },
  { url: "https://www.truist.com", title: "Truist" },
  { url: "https://www.td.com", title: "TD Bank" },
  { url: "https://www.bmo.com", title: "BMO Harris" },
  { url: "https://www.fifththird.com", title: "Fifth Third Bank" },
  { url: "https://www.key.com", title: "KeyBank" },
  { url: "https://www.regions.com", title: "Regions Bank" },
  { url: "https://www.huntington.com", title: "Huntington Bank" },
  { url: "https://www.ally.com", title: "Ally Financial" },
  { url: "https://www.discover.com", title: "Discover" },
  { url: "https://www.synchrony.com", title: "Synchrony" },
  { url: "https://www.citizensbank.com", title: "Citizens Bank" },

  // Regional & Community Banks
  { url: "https://www.bbva.com", title: "BBVA" },
  { url: "https://www.comerica.com", title: "Comerica" },
  { url: "https://www.zionsbank.com", title: "Zions Bank" },
  { url: "https://www.frostbank.com", title: "Frost Bank" },
  { url: "https://www.associatedbank.com", title: "Associated Bank" },
  { url: "https://www.firsthorizon.com", title: "First Horizon" },
  { url: "https://www.cadencebank.com", title: "Cadence Bank" },
  { url: "https://www.synovus.com", title: "Synovus" },
  { url: "https://www.wintrust.com", title: "Wintrust" },
  { url: "https://www.cnb.com", title: "City National Bank" },
  { url: "https://www.eastwestbank.com", title: "East West Bank" },
  { url: "https://www.westernalliancebank.com", title: "Western Alliance Bank" },
  { url: "https://www.pacwest.com", title: "PacWest" },
  { url: "https://www.firstcitizens.com", title: "First Citizens Bank" },
  { url: "https://www.oldnational.com", title: "Old National Bank" },
  { url: "https://www.fultonbank.com", title: "Fulton Bank" },
  { url: "https://www.umb.com", title: "UMB Bank" },
  { url: "https://www.arvest.com", title: "Arvest Bank" },
  { url: "https://www.simmonsbank.com", title: "Simmons Bank" },
  { url: "https://www.bokfinancial.com", title: "BOK Financial" },
  { url: "https://www.prosperitybank.com", title: "Prosperity Bank" },
  { url: "https://www.internationalbank.com", title: "International Bank of Commerce" },
  { url: "https://www.texascapital.com", title: "Texas Capital Bank" },
  { url: "https://www.cathaybank.com", title: "Cathay Bank" },
  { url: "https://www.hanmi.com", title: "Hanmi Bank" },
  { url: "https://www.metropolitanbankny.com", title: "Metropolitan Commercial Bank" },
  { url: "https://www.customersbank.com", title: "Customers Bank" },
  { url: "https://www.axosbank.com", title: "Axos Bank" },
  { url: "https://www.lendingclub.com", title: "LendingClub Bank" },

  // Credit Unions
  { url: "https://www.navyfederal.org", title: "Navy Federal Credit Union" },
  { url: "https://www.penfed.org", title: "PenFed Credit Union" },
  { url: "https://www.schoolsfirstfcu.org", title: "SchoolsFirst FCU" },
  { url: "https://www.golden1.com", title: "Golden 1 Credit Union" },
  { url: "https://www.americafirst.com", title: "America First Credit Union" },
  { url: "https://www.alliantcreditunion.org", title: "Alliant Credit Union" },
  { url: "https://www.dcu.org", title: "DCU (Digital Federal Credit Union)" },
  { url: "https://www.vystarcu.org", title: "VyStar Credit Union" },
  { url: "https://www.sfccu.org", title: "State Employees' Credit Union (NC)" },
  { url: "https://www.becu.org", title: "BECU (Boeing Employees)" },
  { url: "https://www.firsttechfed.com", title: "First Tech Federal Credit Union" },
  { url: "https://www.suncoastcreditunion.com", title: "Suncoast Credit Union" },
  { url: "https://www.teachersfcu.org", title: "Teachers Federal Credit Union" },
  { url: "https://www.tinkerfcu.org", title: "Tinker Federal Credit Union" },
  { url: "https://www.ent.com", title: "Ent Credit Union" },
  { url: "https://www.chevronfcu.org", title: "Chevron Federal Credit Union" },

  // Fintech & Digital Banking
  { url: "https://www.sofi.com", title: "SoFi" },
  { url: "https://www.chime.com", title: "Chime" },
  { url: "https://www.varomoney.com", title: "Varo Bank" },
  { url: "https://www.current.com", title: "Current" },
  { url: "https://www.aspiration.com", title: "Aspiration" },
  { url: "https://www.wealthfront.com", title: "Wealthfront" },
  { url: "https://www.betterment.com", title: "Betterment" },
  { url: "https://www.robinhood.com", title: "Robinhood" },
  { url: "https://www.coinbase.com", title: "Coinbase" },
  { url: "https://www.kraken.com", title: "Kraken" },
  { url: "https://www.revolut.com", title: "Revolut" },
  { url: "https://www.n26.com", title: "N26" },
  { url: "https://www.monzo.com", title: "Monzo" },
  { url: "https://www.starlingbank.com", title: "Starling Bank" },

  // Investment, Brokerage & Asset Management
  { url: "https://www.vanguard.com", title: "Vanguard" },
  { url: "https://www.fidelity.com", title: "Fidelity" },
  { url: "https://www.schwab.com", title: "Charles Schwab" },
  { url: "https://www.troweprice.com", title: "T. Rowe Price" },
  { url: "https://www.blackrock.com", title: "BlackRock" },
  { url: "https://www.jpmorgan.com", title: "J.P. Morgan" },
  { url: "https://www.morganstanley.com", title: "Morgan Stanley" },
  { url: "https://www.goldmansachs.com", title: "Goldman Sachs" },
  { url: "https://www.ubs.com", title: "UBS" },
  { url: "https://www.wellsfargoadvisors.com", title: "Wells Fargo Advisors" },
  { url: "https://www.etrade.com", title: "E*TRADE" },
  { url: "https://www.tdameritrade.com", title: "TD Ameritrade" },
  { url: "https://www.interactivebrokers.com", title: "Interactive Brokers" },
  { url: "https://www.merrilledge.com", title: "Merrill Edge" },
  { url: "https://www.wealthsimple.com", title: "Wealthsimple" },
  { url: "https://www.acorns.com", title: "Acorns" },
  { url: "https://www.stash.com", title: "Stash" },
  { url: "https://www.public.com", title: "Public" },
  { url: "https://www.webull.com", title: "Webull" },

  // Payment Processors, Cards & Services
  { url: "https://www.paypal.com", title: "PayPal" },
  { url: "https://www.venmo.com", title: "Venmo" },
  { url: "https://cash.app", title: "Cash App" },
  { url: "https://www.stripe.com", title: "Stripe" },
  { url: "https://www.shopify.com/payments", title: "Shopify Payments" },
  { url: "https://www.affirm.com", title: "Affirm" },
  { url: "https://www.klarna.com", title: "Klarna" },
  { url: "https://www.afterpay.com", title: "Afterpay" },
  { url: "https://www.sezzle.com", title: "Sezzle" },
  { url: "https://www.visa.com", title: "Visa" },
  { url: "https://www.mastercard.com", title: "Mastercard" },
  { url: "https://www.americanexpress.com", title: "American Express" },
  { url: "https://www.dinersclub.com", title: "Diners Club" },
  { url: "https://www.zellepay.com", title: "Zelle" },
  { url: "https://www.apple.com/apple-pay", title: "Apple Pay" },
  { url: "https://www.google.com/pay", title: "Google Pay" },
  { url: "https://www.samsung.com/pay", title: "Samsung Pay" },
  { url: "https://www.intuit.com", title: "Intuit" },
  { url: "https://www.creditkarma.com", title: "Credit Karma" },
  { url: "https://www.nerdwallet.com", title: "NerdWallet" },

  // Mortgage & Real Estate Finance
  { url: "https://www.rocketmortgage.com", title: "Rocket Mortgage" },
  { url: "https://www.quickenloans.com", title: "Quicken Loans" },
  { url: "https://www.bankrate.com", title: "Bankrate" },
  { url: "https://www.lendingtree.com", title: "LendingTree" },

  // Insurance
  { url: "https://www.progressive.com", title: "Progressive" },
  { url: "https://www.geico.com", title: "GEICO" },
  { url: "https://www.statefarm.com", title: "State Farm" },
  { url: "https://www.allstate.com", title: "Allstate" },
  { url: "https://www.libertymutual.com", title: "Liberty Mutual" },
  { url: "https://www.usaa.com", title: "USAA" },
  { url: "https://www.farmers.com", title: "Farmers Insurance" },
  { url: "https://www.nationwide.com", title: "Nationwide" },
  { url: "https://www.travelers.com", title: "Travelers" },
  { url: "https://www.chubb.com", title: "Chubb" },
  { url: "https://www.aig.com", title: "AIG" },

  // Crypto & Digital Assets
  { url: "https://www.binance.us", title: "Binance US" },
  { url: "https://www.gemini.com", title: "Gemini" },
  { url: "https://www.crypto.com", title: "Crypto.com" },
  { url: "https://www.blockchain.com", title: "Blockchain.com" },
  { url: "https://www.bitstamp.net", title: "Bitstamp" },

  // Student Loans & Consumer Finance
  { url: "https://www.navient.com", title: "Navient" },
  { url: "https://www.salliemae.com", title: "Sallie Mae" },
  { url: "https://www.earnest.com", title: "Earnest" },
  { url: "https://www.commonbond.com", title: "CommonBond" },

  // B2B / Enterprise Finance
  { url: "https://www.bill.com", title: "Bill.com" },
  { url: "https://www.brex.com", title: "Brex" },
  { url: "https://www.ramp.com", title: "Ramp" },
  { url: "https://www.expensify.com", title: "Expensify" },
  { url: "https://www.gusto.com", title: "Gusto" },
  { url: "https://www.rippling.com", title: "Rippling" },
  { url: "https://www.mercury.com", title: "Mercury" },
  { url: "https://www.rho.co", title: "Rho" },

  // WealthTech & Robo-Advisors (continued)
  { url: "https://www.ellevest.com", title: "Ellevest" },
  { url: "https://www.sigfig.com", title: "SigFig" },
  { url: "https://www.personalcapital.com", title: "Personal Capital" },

  // Credit Reporting & Scoring
  { url: "https://www.equifax.com", title: "Equifax" },
  { url: "https://www.experian.com", title: "Experian" },
  { url: "https://www.transunion.com", title: "TransUnion" },
  { url: "https://www.myfico.com", title: "myFICO" },

  // Regulatory & Government Finance
  { url: "https://www.sec.gov", title: "U.S. SEC" },
  { url: "https://www.fdic.gov", title: "FDIC" },
  { url: "https://www.federalreserve.gov", title: "Federal Reserve" },
  { url: "https://www.treasury.gov", title: "U.S. Treasury" },
  { url: "https://www.consumerfinance.gov", title: "Consumer Financial Protection Bureau" },
    // Finance & Banking – Batch 2
  // More Regional & Community Banks
  { url: "https://www.firstcitizens.com", title: "First Citizens Bank" },
  { url: "https://www.cadencebank.com", title: "Cadence Bank" },
  { url: "https://www.synovus.com", title: "Synovus" },
  { url: "https://www.wintrust.com", title: "Wintrust" },
  { url: "https://www.umb.com", title: "UMB Bank" },
  { url: "https://www.arvest.com", title: "Arvest Bank" },
  { url: "https://www.simmonsbank.com", title: "Simmons Bank" },
  { url: "https://www.bokfinancial.com", title: "BOK Financial" },
  { url: "https://www.prosperitybank.com", title: "Prosperity Bank" },
  { url: "https://www.texascapital.com", title: "Texas Capital Bank" },
  { url: "https://www.cathaybank.com", title: "Cathay Bank" },
  { url: "https://www.hanmi.com", title: "Hanmi Bank" },
  { url: "https://www.metropolitanbankny.com", title: "Metropolitan Commercial Bank" },
  { url: "https://www.customersbank.com", title: "Customers Bank" },
  { url: "https://www.lendingclub.com", title: "LendingClub Bank" },
  { url: "https://www.sofi.com", title: "SoFi Bank" },
  { url: "https://www.axosbank.com", title: "Axos Bank" },
  { url: "https://www.liveoakbank.com", title: "Live Oak Bank" },
  { url: "https://www.crossriverbank.com", title: "Cross River Bank" },
  { url: "https://www.signaturebank.com", title: "Signature Bank (legacy)" },

  // Additional Regional Banks & Thrifts
  { url: "https://www.associatedbank.com", title: "Associated Bank" },
  { url: "https://www.firsthorizon.com", title: "First Horizon" },
  { url: "https://www.fultonbank.com", title: "Fulton Bank" },
  { url: "https://www.oldnational.com", title: "Old National Bank" },
  { url: "https://www.hancockwhitney.com", title: "Hancock Whitney" },
  { url: "https://www.trustmark.com", title: "Trustmark" },
  { url: "https://www.bancorpsouth.com", title: "BancorpSouth" },
  { url: "https://www.southstatebank.com", title: "South State Bank" },
  { url: "https://www.atlanticunionbank.com", title: "Atlantic Union Bank" },
  { url: "https://www.wsfsbank.com", title: "WSFS Bank" },
  { url: "https://www.bfsbank.com", title: "BFS Bank" },
  { url: "https://www.oceanfirst.com", title: "OceanFirst Bank" },
  { url: "https://www.providentbank.com", title: "Provident Bank" },
  { url: "https://www.lakelandbank.com", title: "Lakeland Bank" },
  { url: "https://www.peapackgladstonebank.com", title: "Peapack-Gladstone Bank" },
  { url: "https://www.connectonebank.com", title: "ConnectOne Bank" },
  { url: "https://www.nbb.com", title: "Northwest Bancorp" },
  { url: "https://www.sandyspringbank.com", title: "Sandy Spring Bank" },
  { url: "https://www.univest.com", title: "Univest" },
  { url: "https://www.bnymellon.com", title: "BNY Mellon" },
  { url: "https://www.statestreet.com", title: "State Street" },
  { url: "https://www.frostbank.com", title: "Frost Bank" },
  { url: "https://www.zionsbank.com", title: "Zions Bank" },
  { url: "https://www.comerica.com", title: "Comerica" },

  // Insurance Companies
  { url: "https://www.statefarm.com", title: "State Farm" },
  { url: "https://www.geico.com", title: "GEICO" },
  { url: "https://www.progressive.com", title: "Progressive" },
  { url: "https://www.allstate.com", title: "Allstate" },
  { url: "https://www.usaa.com", title: "USAA" },
  { url: "https://www.farmers.com", title: "Farmers" },
  { url: "https://www.nationwide.com", title: "Nationwide" },
  { url: "https://www.travelers.com", title: "Travelers" },
  { url: "https://www.libertymutual.com", title: "Liberty Mutual" },
  { url: "https://www.chubb.com", title: "Chubb" },
  { url: "https://www.aig.com", title: "AIG" },
  { url: "https://www.metlife.com", title: "MetLife" },
  { url: "https://www.prudential.com", title: "Prudential" },
  { url: "https://www.newyorklife.com", title: "New York Life" },
  { url: "https://www.massmutual.com", title: "MassMutual" },
  { url: "https://www.northwesternmutual.com", title: "Northwestern Mutual" },
  { url: "https://www.guardianlife.com", title: "Guardian Life" },
  { url: "https://www.mutualofomaha.com", title: "Mutual of Omaha" },
  { url: "https://www.thehartford.com", title: "The Hartford" },
  { url: "https://www.cigna.com", title: "Cigna" },

  // More Fintech, Lending & Consumer Finance
  { url: "https://www.affirm.com", title: "Affirm" },
  { url: "https://www.klarna.com", title: "Klarna" },
  { url: "https://www.afterpay.com", title: "Afterpay" },
  { url: "https://www.sezzle.com", title: "Sezzle" },
  { url: "https://www.upgrade.com", title: "Upgrade" },
  { url: "https://www.lendingtree.com", title: "LendingTree" },
  { url: "https://www.nerdwallet.com", title: "NerdWallet" },
  { url: "https://www.bankrate.com", title: "Bankrate" },
  { url: "https://www.creditkarma.com", title: "Credit Karma" },
  { url: "https://www.upstart.com", title: "Upstart" },
  { url: "https://www.prosper.com", title: "Prosper" },
  { url: "https://www.earnest.com", title: "Earnest" },
  { url: "https://www.commonbond.co", title: "CommonBond" },
  { url: "https://www.salliemae.com", title: "Sallie Mae" },
  { url: "https://www.navient.com", title: "Navient" },
  { url: "https://www.nelnet.com", title: "Nelnet" },
  { url: "https://www.aspiration.com", title: "Aspiration" },
  { url: "https://www.varomoney.com", title: "Varo" },

  // Investment, Wealth & Asset Management (Deeper)
  { url: "https://www.empower.com", title: "Empower Retirement (Personal Capital)" },
  { url: "https://www.ellevest.com", title: "Ellevest" },
  { url: "https://www.betterment.com", title: "Betterment" },
  { url: "https://www.wealthfront.com", title: "Wealthfront" },
  { url: "https://www.sigfig.com", title: "SigFig" },
  { url: "https://www.futureadvisor.com", title: "FutureAdvisor (BlackRock)" },
  { url: "https://www.schwab.com", title: "Charles Schwab" },
  { url: "https://www.vanguard.com", title: "Vanguard" },
  { url: "https://www.fidelity.com", title: "Fidelity" },
  { url: "https://www.merrilledge.com", title: "Merrill Edge" },

  // More Brokers & Asset Managers
  { url: "https://www.interactivebrokers.com", title: "Interactive Brokers" },
  { url: "https://www.thinkorswim.com", title: "thinkorswim" },
  { url: "https://www.etrade.com", title: "E*TRADE" },
  { url: "https://www.tdameritrade.com", title: "TD Ameritrade" },
  { url: "https://www.public.com", title: "Public" },
  { url: "https://www.webull.com", title: "Webull" },
  { url: "https://www.robinhood.com", title: "Robinhood" },
  { url: "https://www.tastytrade.com", title: "tastytrade" },
  { url: "https://www.lightspeed.com", title: "Lightspeed" },
  { url: "https://www.invesco.com", title: "Invesco" },
  { url: "https://www.franklintempleton.com", title: "Franklin Templeton" },
  { url: "https://www.pimco.com", title: "PIMCO" },
  { url: "https://www.oppenheimer.com", title: "Oppenheimer" },
  { url: "https://www.lordabbett.com", title: "Lord Abbett" },

  // Payment, Crypto & Specialized Fintech
  { url: "https://www.stripe.com", title: "Stripe" },
  { url: "https://www.paypal.com", title: "PayPal" },
  { url: "https://www.squareup.com", title: "Square" },
  { url: "https://cash.app", title: "Cash App" },
  { url: "https://www.venmo.com", title: "Venmo" },
  { url: "https://www.zellepay.com", title: "Zelle" },
  { url: "https://www.apple.com/apple-pay", title: "Apple Pay" },
  { url: "https://www.google.com/pay", title: "Google Pay" },
  { url: "https://www.samsung.com/pay", title: "Samsung Pay" },
  { url: "https://www.coinbase.com", title: "Coinbase" },
  { url: "https://www.kraken.com", title: "Kraken" },
  { url: "https://www.gemini.com", title: "Gemini" },
  { url: "https://www.crypto.com", title: "Crypto.com" },
  { url: "https://www.binance.us", title: "Binance.US" },
  { url: "https://www.bitstamp.net", title: "Bitstamp" },
  { url: "https://www.blockchain.com", title: "Blockchain.com" },
  { url: "https://www.circle.com", title: "Circle" },
  { url: "https://tether.to", title: "Tether" },
  { url: "https://www.ripple.com", title: "Ripple" },

  // Mortgage Specialists
  { url: "https://www.rocketmortgage.com", title: "Rocket Mortgage" },
  { url: "https://www.quickenloans.com", title: "Quicken Loans" },
  { url: "https://www.mrcooper.com", title: "Mr. Cooper" },
  { url: "https://www.loandepot.com", title: "LoanDepot" },
  { url: "https://www.caliberhomeloans.com", title: "Caliber Home Loans" },
  { url: "https://www.guaranteedrate.com", title: "Guaranteed Rate" },
  { url: "https://www.fairwayindependent.com", title: "Fairway Independent" },

  // Credit Reporting & Scoring (additional)
  { url: "https://www.equifax.com", title: "Equifax" },
  { url: "https://www.experian.com", title: "Experian" },
  { url: "https://www.transunion.com", title: "TransUnion" },
  { url: "https://www.myfico.com", title: "myFICO" },
  { url: "https://www.creditsesame.com", title: "Credit Sesame" },
  { url: "https://www.self.inc", title: "Self" },

  // B2B Finance / Payroll
  { url: "https://www.bill.com", title: "Bill.com" },
  { url: "https://www.brex.com", title: "Brex" },
  { url: "https://www.ramp.com", title: "Ramp" },
  { url: "https://www.expensify.com", title: "Expensify" },
  { url: "https://www.gusto.com", title: "Gusto" },
  { url: "https://www.rippling.com", title: "Rippling" },
  { url: "https://www.mercury.com", title: "Mercury" },
  { url: "https://www.rho.co", title: "Rho" },
  { url: "https://www.deel.com", title: "Deel" },
  { url: "https://www.wise.com", title: "Wise" },
  { url: "https://www.payoneer.com", title: "Payoneer" },

  // Retirement & Benefits
  { url: "https://www.principal.com", title: "Principal Financial" },
  { url: "https://www.adp.com", title: "ADP" },
  { url: "https://www.paychex.com", title: "Paychex" },

  // Regulatory & Government Finance
  { url: "https://www.occ.gov", title: "Office of the Comptroller of the Currency" },
  { url: "https://www.finra.org", title: "FINRA" },
    // Finance & Banking – Additional Banks, Credit Unions, Fintech & Mortgage
  // More Community & Regional Banks
  { url: "https://www.wsfsbank.com", title: "WSFS Financial" },
  { url: "https://www.oceanfirst.com", title: "OceanFirst Bank" },
  { url: "https://www.providentbank.com", title: "Provident Bank" },
  { url: "https://www.lakelandbank.com", title: "Lakeland Bank" },
  { url: "https://www.peapackgladstonebank.com", title: "Peapack-Gladstone Bank" },
  { url: "https://www.connectonebank.com", title: "ConnectOne Bank" },
  { url: "https://www.nbb.com", title: "Northwest Bancorp" },
  { url: "https://www.sandyspringbank.com", title: "Sandy Spring Bank" },
  { url: "https://www.univest.com", title: "Univest Financial" },
  { url: "https://www.bfsbank.com", title: "Berkshire Bank (BFS Bank)" },
  { url: "https://www.firstbank.com", title: "First Bank (various regional)" },
  { url: "https://www.flagstar.com", title: "Flagstar Bank" },
  { url: "https://www.nycb.com", title: "New York Community Bank" },
  { url: "https://www.sterlingbank.com", title: "Sterling Bank (various)" },
  { url: "https://www.easternbank.com", title: "Eastern Bank" },
  { url: "https://www.berkshirebank.com", title: "Berkshire Bank" },
  { url: "https://www.independentbank.com", title: "Independent Bank (various)" },
  { url: "https://www.columbiabank.com", title: "Columbia Bank" },
  { url: "https://www.heritagebank.com", title: "Heritage Bank (various)" },
  { url: "https://www.pinnaclebank.com", title: "Pinnacle Bank (various)" },
  { url: "https://www.valley.com", title: "Valley National Bank" },
  { url: "https://www.websterbank.com", title: "Webster Bank" },
  { url: "https://www.unitedbank.com", title: "United Bank (various)" },
  { url: "https://www.oldsecond.com", title: "Old Second Bank" },
  { url: "https://www.bylinebank.com", title: "Byline Bank" },
  { url: "https://www.crossfirstbank.com", title: "CrossFirst Bank" },
  { url: "https://www.veritexbank.com", title: "Veritex Bank" },
  { url: "https://www.allegiancebank.com", title: "Allegiance Bank" },
  { url: "https://www.origin.bank", title: "Origin Bank" },
  { url: "https://www.firstfinancialbank.com", title: "First Financial Bank (various)" },
  { url: "https://www.glacierbank.com", title: "Glacier Bank" },
  { url: "https://www.htlf.com", title: "Heartland Financial" },
  { url: "https://www.townebank.com", title: "TowneBank" },
  { url: "https://www.firstmidwest.com", title: "First Midwest (legacy)" },
  { url: "https://www.greatwesternbank.com", title: "Great Western Bank (legacy)" },

  // More Credit Unions
  { url: "https://www.citizenscu.com", title: "Citizens Credit Union (various)" },
  { url: "https://www.consumerscu.org", title: "Consumers Credit Union" },
  { url: "https://www.afcu.org", title: "Armed Forces Credit Union (various)" },

  // Insurtech & Insurance Comparison
  { url: "https://www.lemonade.com", title: "Lemonade" },
  { url: "https://www.rootinsurance.com", title: "Root Insurance" },
  { url: "https://www.hippo.com", title: "Hippo Insurance" },
  { url: "https://www.nextinsurance.com", title: "Next Insurance" },
  { url: "https://www.trupanion.com", title: "Trupanion (pet insurance)" },
  { url: "https://www.policygenius.com", title: "Policygenius" },
  { url: "https://www.thezebra.com", title: "The Zebra" },
  { url: "https://www.insurify.com", title: "Insurify" },
  { url: "https://www.everquote.com", title: "EverQuote" },

  // Mortgage & Lending (additional)
  { url: "https://www.homepoint.com", title: "Homepoint" },
  { url: "https://www.better.com", title: "Better Mortgage" },
  { url: "https://www.lendistry.com", title: "Lendistry" },
  { url: "https://www.bluevine.com", title: "Bluevine" },
  { url: "https://www.fundbox.com", title: "Fundbox" },
  { url: "https://www.ondeck.com", title: "OnDeck" },

  // Other/Small Business Banking
  { url: "https://www.kabbage.com", title: "Kabbage (legacy)" },
    // Finance & Banking – UK
  // Major High Street Banks
  { url: "https://www.barclays.co.uk", title: "Barclays" },
  { url: "https://www.natwest.com", title: "NatWest" },
  { url: "https://www.lloydsbank.com", title: "Lloyds Bank" },
  { url: "https://www.hsbc.co.uk", title: "HSBC UK" },
  { url: "https://www.santander.co.uk", title: "Santander UK" },
  { url: "https://www.halifax.co.uk", title: "Halifax" },
  { url: "https://www.bankofscotland.co.uk", title: "Bank of Scotland" },
  { url: "https://www.rbs.co.uk", title: "Royal Bank of Scotland" },
  { url: "https://www.tsb.co.uk", title: "TSB Bank" },
  { url: "https://www.clydesdalebank.co.uk", title: "Clydesdale Bank" },
  { url: "https://www.virginmoney.com", title: "Virgin Money" },
  { url: "https://www.metrobankonline.co.uk", title: "Metro Bank" },
  { url: "https://www.starlingbank.com", title: "Starling Bank" },
  { url: "https://www.monzo.com", title: "Monzo" },
  { url: "https://www.revolut.com", title: "Revolut" },
  { url: "https://www.nationwide.co.uk", title: "Nationwide Building Society" },
  { url: "https://www.co-operativebank.co.uk", title: "The Co-operative Bank" },
  { url: "https://www.firstdirect.com", title: "First Direct" },
  { url: "https://www.smile.co.uk", title: "Smile (Co-op)" },
  { url: "https://bank.marksandspencer.com", title: "M&S Bank" },

  // Challenger Banks & Digital
  { url: "https://www.oaknorth.com", title: "OakNorth Bank" },
  { url: "https://www.atombank.com", title: "Atom Bank" },
  { url: "https://www.tide.co", title: "Tide" },
  { url: "https://www.anna.money", title: "Anna" },
  { url: "https://www.curve.app", title: "Curve" },
  { url: "https://www.pockit.com", title: "Pockit" },
  { url: "https://www.hyperjar.com", title: "HyperJar" },
  { url: "https://www.sainsburysbank.co.uk", title: "Sainsbury's Bank" },
  { url: "https://money.asda.com", title: "Asda Money" },
  { url: "https://www.tescobank.com", title: "Tesco Bank" },
  { url: "https://www.johnlewisfinance.com", title: "John Lewis Finance" },

  // Building Societies
  { url: "https://www.skipton.co.uk", title: "Skipton Building Society" },
  { url: "https://www.yorkshirebuildingsociety.co.uk", title: "Yorkshire Building Society" },
  { url: "https://www.coventrybuildingsociety.co.uk", title: "Coventry Building Society" },
  { url: "https://www.leedsbuildingsociety.co.uk", title: "Leeds Building Society" },
  { url: "https://www.principality.co.uk", title: "Principality Building Society" },
  { url: "https://www.westbrom.co.uk", title: "West Bromwich Building Society" },
  { url: "https://www.thecheshire.co.uk", title: "Cheshire Building Society" },
  { url: "https://www.cumberland.co.uk", title: "Cumberland Building Society" },
  { url: "https://www.derbyshirebs.co.uk", title: "Derbyshire Building Society" },
  { url: "https://www.dudleybuildingsociety.co.uk", title: "Dudley Building Society" },
  { url: "https://www.furnessbs.co.uk", title: "Furness Building Society" },
  { url: "https://www.hrbs.co.uk", title: "Hinckley & Rugby Building Society" },
  { url: "https://www.ibs.co.uk", title: "Ipswich Building Society" },
  { url: "https://www.kensingtonmortgages.co.uk", title: "Kensington Building Society" },
  { url: "https://www.themanchester.co.uk", title: "Manchester Building Society" },
  { url: "https://www.mhbs.co.uk", title: "Market Harborough Building Society" },
  { url: "https://www.marsdenbs.co.uk", title: "Marsden Building Society" },
  { url: "https://www.mmbs.co.uk", title: "Melton Mowbray Building Society" },
  { url: "https://www.midlandsbs.co.uk", title: "Midlands Building Society" },
  { url: "https://www.newbury.co.uk", title: "Newbury Building Society" },
  { url: "https://www.newcastle.co.uk", title: "Newcastle Building Society" },
  { url: "https://www.nandp.co.uk", title: "Norwich & Peterborough Building Society" },
  { url: "https://www.thenottingham.com", title: "Nottingham Building Society" },
  { url: "https://www.penrithbs.co.uk", title: "Penrith Building Society" },
  { url: "https://www.progressivebuildingsociety.co.uk", title: "Progressive Building Society" },
  { url: "https://www.saffronbs.co.uk", title: "Saffron Building Society" },
  { url: "https://www.scottishbs.co.uk", title: "Scottish Building Society" },
  { url: "https://www.staffordshirebuildingsociety.co.uk", title: "Staffordshire Building Society" },
  { url: "https://www.swansea-bs.co.uk", title: "Swansea Building Society" },
  { url: "https://www.teachersbs.co.uk", title: "Teachers Building Society" },
  { url: "https://www.thetipton.co.uk", title: "Tipton & Coseley Building Society" },
  { url: "https://www.vernonbs.co.uk", title: "Vernon Building Society" },

  // Investment Banks, Asset Management & Markets
  { url: "https://www.jpmorgan.com", title: "J.P. Morgan (UK)" },
  { url: "https://www.goldmansachs.com", title: "Goldman Sachs (UK)" },
  { url: "https://www.morganstanley.com", title: "Morgan Stanley (UK)" },
  { url: "https://www.barclays.com", title: "Barclays Investment Bank" },
  { url: "https://www.ubs.com", title: "UBS (UK)" },
  { url: "https://www.credit-suisse.com", title: "Credit Suisse (legacy)" },
  { url: "https://www.deutsche-bank.co.uk", title: "Deutsche Bank (UK)" },
  { url: "https://www.citigroup.com", title: "Citigroup (UK)" },
  { url: "https://www.hsbc.com", title: "HSBC Global Banking" },
  { url: "https://www.blackrock.com", title: "BlackRock (UK)" },
  { url: "https://www.vanguard.co.uk", title: "Vanguard UK" },
  { url: "https://www.fidelity.co.uk", title: "Fidelity International" },
  { url: "https://www.schroders.com", title: "Schroders" },
  { url: "https://www.abrdn.com", title: "abrdn" },
  { url: "https://www.legalandgeneral.com", title: "Legal & General" },
  { url: "https://www.aviva.com", title: "Aviva" },
  { url: "https://www.prudential.co.uk", title: "Prudential UK" },
  { url: "https://www.standardlife.co.uk", title: "Standard Life" },
  { url: "https://www.scottishwidows.co.uk", title: "Scottish Widows" },
  { url: "https://www.oldmutualwealth.co.uk", title: "Old Mutual Wealth" },

  // Insurance, Payment & Fintech
  { url: "https://www.directline.com", title: "Direct Line" },
  { url: "https://www.comparethemarket.com", title: "Compare the Market" },
  { url: "https://www.gocompare.com", title: "GoCompare" },
  { url: "https://www.confused.com", title: "Confused.com" },
  { url: "https://www.aviva.co.uk", title: "Aviva UK" },
  { url: "https://www.axa.co.uk", title: "AXA UK" },
  { url: "https://www.allianz.co.uk", title: "Allianz UK" },
  { url: "https://www.zurich.co.uk", title: "Zurich UK" },
  { url: "https://www.lv.com", title: "LV=" },
  { url: "https://www.ageas.co.uk", title: "Ageas UK" },
  { url: "https://www.paypal.co.uk", title: "PayPal UK" },
  { url: "https://www.stripe.com", title: "Stripe (UK)" },
  { url: "https://www.worldpay.com", title: "Worldpay (FIS)" },
  { url: "https://www.barclaycard.co.uk", title: "Barclaycard" },
  { url: "https://www.visa.co.uk", title: "Visa UK" },
  { url: "https://www.mastercard.co.uk", title: "Mastercard UK" },
  { url: "https://www.klarna.com", title: "Klarna (UK)" },
  { url: "https://www.afterpay.com", title: "Afterpay (UK)" },
    // Finance & Banking – UK (Batch 2)
  // Additional Building Societies & Mutuals (using alternate/primary domains)
  { url: "https://www.skipton.co.uk", title: "Skipton Building Society" },
  { url: "https://www.yorkshire-bldg-soc.co.uk", title: "Yorkshire Building Society" },
  { url: "https://www.coventrybuildingsociety.co.uk", title: "Coventry Building Society" },
  { url: "https://www.leedsbuildingsociety.co.uk", title: "Leeds Building Society" },
  { url: "https://www.principality.co.uk", title: "Principality Building Society" },
  { url: "https://www.westbrom.co.uk", title: "West Bromwich Building Society" },
  { url: "https://www.cheshirebs.co.uk", title: "Cheshire Building Society" },
  { url: "https://www.cumberland.co.uk", title: "Cumberland Building Society" },
  { url: "https://www.derbyshirebs.co.uk", title: "Derbyshire Building Society" },
  { url: "https://www.dudleybs.co.uk", title: "Dudley Building Society" },
  { url: "https://www.furnessbs.co.uk", title: "Furness Building Society" },
  { url: "https://www.hinckleyandrugbybs.co.uk", title: "Hinckley & Rugby Building Society" },
  { url: "https://www.ipswich-bs.co.uk", title: "Ipswich Building Society" },
  { url: "https://www.kensington.co.uk", title: "Kensington Building Society" },
  { url: "https://www.manchesterbs.co.uk", title: "Manchester Building Society" },
  { url: "https://www.marketharboroughbs.co.uk", title: "Market Harborough Building Society" },
  { url: "https://www.marsdenbs.co.uk", title: "Marsden Building Society" },
  { url: "https://www.meltonmowbraybs.co.uk", title: "Melton Mowbray Building Society" },
  { url: "https://www.midlandsbs.co.uk", title: "Midlands Building Society" },
  { url: "https://www.newbury.co.uk", title: "Newbury Building Society" },
  { url: "https://www.newcastle.co.uk", title: "Newcastle Building Society" },
  { url: "https://www.norwichandpeterborough.co.uk", title: "Norwich & Peterborough Building Society" },
  { url: "https://www.nottinghambs.co.uk", title: "Nottingham Building Society" },
  { url: "https://www.penrithbs.co.uk", title: "Penrith Building Society" },
  { url: "https://www.progressivebs.co.uk", title: "Progressive Building Society" },
  { url: "https://www.saffronbs.co.uk", title: "Saffron Building Society" },
  { url: "https://www.scottishbs.co.uk", title: "Scottish Building Society" },
  { url: "https://www.staffordshirebs.co.uk", title: "Staffordshire Building Society" },
  { url: "https://www.swanseabs.co.uk", title: "Swansea Building Society" },
  { url: "https://www.teachersbs.co.uk", title: "Teachers Building Society" },
  // More smaller societies (additional)
  { url: "https://www.thetipton.co.uk", title: "Tipton & Coseley Building Society" },
  { url: "https://www.vernonbs.co.uk", title: "Vernon Building Society" },
  { url: "https://www.harpendenbs.co.uk", title: "Harpenden Building Society" },
  { url: "https://www.cambridgebuildingsociety.co.uk", title: "Cambridge Building Society" },
  { url: "https://www.bathbuildingsociety.co.uk", title: "Bath Building Society" },
  { url: "https://www.ecology.co.uk", title: "Ecology Building Society" },
  { url: "https://www.fordmoney.co.uk", title: "Ford Money" },

  // Challenger & Specialist Banks (additional)
  { url: "https://www.fundingcircle.com", title: "Funding Circle" },
  { url: "https://www.iwoca.co.uk", title: "iwoca" },
  { url: "https://www.capify.com", title: "Capify" },
  { url: "https://www.liberis.co.uk", title: "Liberis" },
  { url: "https://www.marketinvoice.com", title: "MarketInvoice" },
  { url: "https://www.pleo.com", title: "Pleo (UK)" },
  { url: "https://www.soldo.com", title: "Soldo (UK)" },
  { url: "https://www.spendesk.com", title: "Spendesk (UK)" },
  { url: "https://www.chase.co.uk", title: "Chase UK" },

  // Insurance, Wealth & Investment (additional)
  { url: "https://www.qbe.com", title: "QBE (UK)" },
  { url: "https://www.hiscox.com", title: "Hiscox" },
  { url: "https://www.aon.co.uk", title: "Aon UK" },
  { url: "https://www.marsh.com", title: "Marsh (UK)" },
  { url: "https://www.willistowerswatson.com", title: "Willis Towers Watson (UK)" },
  { url: "https://www.wealthify.com", title: "Wealthify" },
  { url: "https://www.moneyfarm.com", title: "Moneyfarm" },
  { url: "https://www.nutmeg.com", title: "Nutmeg (J.P. Morgan)" },
  { url: "https://www.scalablecapital.com", title: "Scalable Capital (UK)" },
  { url: "https://www.wealthsimple.com", title: "Wealthsimple UK" },
  { url: "https://www.interactiveinvestor.com", title: "interactive investor" },
  { url: "https://www.hargreaveslansdown.co.uk", title: "Hargreaves Lansdown" },
  { url: "https://www.ajbell.co.uk", title: "AJ Bell" },
  // Trading platforms & brokers
  { url: "https://www.trading212.com", title: "Trading 212" },
  { url: "https://freetrade.io", title: "Freetrade" },
  { url: "https://www.ig.com", title: "IG" },
  { url: "https://www.cmcmarkets.com", title: "CMC Markets" },
  { url: "https://www.plus500.com", title: "Plus500" },
  // Pension providers (additions)
  { url: "https://www.nestpensions.org.uk", title: "NEST Pensions" },
  { url: "https://www.nowpensions.com", title: "Now: Pensions" },

  // Payment, Crypto & Regulatory Niche
  { url: "https://www.binance.com", title: "Binance (UK)" },
  { url: "https://www.ripple.com", title: "Ripple (UK)" },
    // Finance & Banking – UK (Batch 2 continuation)
  // New card/payment UK-specific domains
  { url: "https://www.americanexpress.co.uk", title: "American Express UK" },
  { url: "https://www.dinersclub.co.uk", title: "Diners Club UK" },
  // Payment rails, open banking & embedded finance
  { url: "https://www.gocardless.com", title: "GoCardless" },
  { url: "https://www.modulrfinance.com", title: "Modulr" },
  { url: "https://www.railsbank.com", title: "Railsbank (legacy)" },
  { url: "https://www.bankingcircle.com", title: "Banking Circle" },
  { url: "https://www.solarisbank.com", title: "Solarisbank (UK)" },
  { url: "https://www.clearbank.com", title: "ClearBank" },
  // Crypto & digital assets (new UK-specific or broader)
  { url: "https://www.consensys.net", title: "ConsenSys" },
  { url: "https://www.ledger.com", title: "Ledger" },
  { url: "https://trezor.io", title: "Trezor" },
  { url: "https://www.coinjar.com", title: "CoinJar" },
  { url: "https://www.luno.com", title: "Luno" },
  // Regulatory & government bodies
  { url: "https://www.bankofengland.co.uk", title: "Bank of England" },
  { url: "https://www.fca.org.uk", title: "Financial Conduct Authority" },
  { url: "https://www.bankofengland.co.uk/prudential-regulation", title: "Prudential Regulation Authority" },
  { url: "https://www.financial-ombudsman.org.uk", title: "Financial Ombudsman Service" },
  { url: "https://www.moneyhelper.org.uk", title: "Money and Pensions Service" },
  { url: "https://www.thepensionsregulator.gov.uk", title: "The Pensions Regulator" },
  { url: "https://www.hmrc.gov.uk", title: "HM Revenue & Customs" },
  { url: "https://www.gov.uk/government/organisations/hm-treasury", title: "HM Treasury" },
  { url: "https://www.ukfinance.org.uk", title: "UK Finance" },
  { url: "https://www.bsa.org.uk", title: "Building Societies Association" },
  { url: "https://www.gov.uk/cma", title: "Competition and Markets Authority" },
  { url: "https://www.fscs.org.uk", title: "Financial Services Compensation Scheme" },
  // Wealth management & private banking
  { url: "https://www.quiltercheviot.com", title: "Quilter Cheviot" },
  { url: "https://www.rathbones.com", title: "Rathbones" },
  { url: "https://www.brewin.co.uk", title: "Brewin Dolphin" },
  { url: "https://www.closebrothers.com", title: "Close Brothers" },
  { url: "https://www.investec.com", title: "Investec" },
  { url: "https://www.cazenovecapital.com", title: "Cazenove Capital" },
  { url: "https://www.lazard.com", title: "Lazard" },
  { url: "https://www.rothschildandco.com", title: "Rothschild & Co" },
  // Specialist lending (P2P & mortgage)
  { url: "https://www.landbay.co.uk", title: "Landbay" },
  { url: "https://www.zopa.com", title: "Zopa" },
  { url: "https://www.lendingworks.co.uk", title: "Lending Works" },
  { url: "https://www.habito.com", title: "Habito" },
    // UK Finance – Additional Specialist Lending, Insurance, Pension, Wealth, Private Equity & More
  // Specialist Lenders & Mortgage Providers
  { url: "https://www.precisemortgages.co.uk", title: "Precise Mortgages" },
  { url: "https://www.togethermoney.com", title: "Together (Specialist Lending)" },
  { url: "https://www.shawbrook.co.uk", title: "Shawbrook Bank" },
  { url: "https://www.aldermore.co.uk", title: "Aldermore" },
  // Invoice Finance
  { url: "https://www.bibbyfinancial.com", title: "Bibby Financial" },
  // Equity Release
  { url: "https://www.keyretirement.co.uk", title: "Key Retirement" },
  { url: "https://www.more2life.co.uk", title: "More2Life" },
  // Crowdfunding & Alternative Lending
  { url: "https://www.crowdcube.com", title: "Crowdcube" },
  { url: "https://www.seedrs.com", title: "Seedrs" },
  // Insurance Brokers & Specialists (new)
  { url: "https://www.gallagher.co.uk", title: "Gallagher (UK)" },
  { url: "https://www.howdeninsurance.com", title: "Howden" },
  { url: "https://www.boughtbymany.com", title: "ManyPets (Bought By Many)" },
  // Pension Providers (new)
  { url: "https://www.thepeoplespension.co.uk", title: "People’s Pension" },
  // Asset Management & Private Banking (new)
  { url: "https://www.bailliegifford.com", title: "Baillie Gifford" },
  { url: "https://www.jpmorgan.co.uk", title: "J.P. Morgan Asset Management (UK)" },
  { url: "https://www.coutts.com", title: "Coutts (NatWest)" },
  // Private Equity & Venture Capital
  { url: "https://www.cvc.com", title: "CVC Capital Partners" },
  { url: "https://www.permira.com", title: "Permira" },
  { url: "https://www.3i.com", title: "3i Group" },
  { url: "https://www.adventinternational.com", title: "Advent International" },
  { url: "https://www.indexventures.com", title: "Index Ventures" },
  { url: "https://www.accel.com", title: "Accel" },
  { url: "https://www.balderton.com", title: "Balderton Capital" },
  // Regtech & Consumer Support
  { url: "https://www.complyadvantage.com", title: "ComplyAdvantage" },
  { url: "https://www.thetaray.com", title: "ThetaRay" },
  { url: "https://www.stepchange.org", title: "StepChange Debt Charity" },
    // Finance & Banking – China
  // Major State-Owned Commercial Banks ("Big Four" +)
  { url: "https://www.icbc.com.cn", title: "Industrial and Commercial Bank of China (ICBC)" },
  { url: "https://www.ccb.com", title: "China Construction Bank (CCB)" },
  { url: "https://www.boc.cn", title: "Bank of China (BOC)" },
  { url: "https://www.abchina.com", title: "Agricultural Bank of China (ABC)" },
  { url: "https://www.bankofcommunications.com", title: "Bank of Communications (BoCom)" },
  { url: "https://www.psbc.com", title: "Postal Savings Bank of China (PSBC)" },

  // Policy Banks & Development Institutions
  { url: "https://www.cdb.com.cn", title: "China Development Bank (CDB)" },
  { url: "https://www.eximbank.gov.cn", title: "Export-Import Bank of China" },
  { url: "https://www.adbc.com.cn", title: "Agricultural Development Bank of China (ADBC)" },

  // Joint-Stock Commercial Banks
  { url: "https://www.cmbchina.com", title: "China Merchants Bank (CMB)" },
  { url: "https://www.pab.com.cn", title: "Ping An Bank" },
  { url: "https://www.cib.com.cn", title: "China Industrial Bank (CIB)" },
  { url: "https://www.spdb.com.cn", title: "Shanghai Pudong Development Bank (SPDB)" },
  { url: "https://www.cmbc.com.cn", title: "China Minsheng Bank" },
  { url: "https://www.citicbank.com", title: "CITIC Bank" },
  { url: "https://www.huaxiabank.com.cn", title: "Huaxia Bank" },
  { url: "https://www.everbrightbank.com", title: "China Everbright Bank" },
  { url: "https://www.hxb.com.cn", title: "Huaxia Bank (Alternative)" },

  // City Commercial Banks & Rural
  { url: "https://www.bjbank.com", title: "Bank of Beijing" },
  { url: "https://www.shanghaibank.com", title: "Bank of Shanghai" },
  { url: "https://www.bankofnanjing.com", title: "Bank of Nanjing" },
  { url: "https://www.bankofningbo.com", title: "Bank of Ningbo" },
  { url: "https://www.cqrcb.com", title: "Chongqing Rural Commercial Bank" },
  { url: "https://www.jsbchina.com", title: "Jiangsu Bank" },
  { url: "https://www.hzb.com.cn", title: "Hangzhou Bank" },
  { url: "https://www.gzcb.com.cn", title: "Guangzhou Rural Commercial Bank" },
  { url: "https://www.tjrcb.com", title: "Tianjin Rural Commercial Bank" },
  { url: "https://www.srcb.com", title: "Shanghai Rural Commercial Bank" },

  // Fintech, Digital Banking & Payment Giants
  { url: "https://www.alipay.com", title: "Alipay (Ant Group)" },
  { url: "https://pay.weixin.qq.com", title: "WeChat Pay (Tencent)" },
  { url: "https://www.jd.com", title: "JD Finance / JD Digits" },
  { url: "https://www.meituan.com", title: "Meituan (Finance)" },
  { url: "https://www.didi.com", title: "Didi (Finance)" },
  { url: "https://www.lufax.com", title: "Lufax (Ping An)" },
  { url: "https://www.mybank.cn", title: "MYbank (Ant Group)" },
  { url: "https://www.webank.com", title: "WeBank (Tencent)" },
  { url: "https://www.duxiaoman.com", title: "Du Xiaoman (Baidu Finance)" },
  { url: "https://www.antgroup.com", title: "Ant Group" },
  { url: "https://www.tencent.com", title: "Tencent (Fintech)" },
  { url: "https://www.alibaba.com", title: "Alibaba (Finance)" },
  { url: "https://www.suning.com", title: "Suning (Finance)" },
  { url: "https://www.pinduoduo.com", title: "Pinduoduo (Finance)" },
  { url: "https://www.bilibili.com", title: "Bilibili (Finance)" },

  // Securities, Brokerage & Asset Management
  { url: "https://www.cicc.com", title: "China International Capital Corporation (CICC)" },
  { url: "https://www.citicsecurities.com", title: "CITIC Securities" },
  { url: "https://www.guotai.com.cn", title: "Guotai Junan Securities" },
  { url: "https://www.haitong.com", title: "Haitong Securities" },
  { url: "https://www.shenwanhongyuan.com", title: "Shenwan Hongyuan" },
  { url: "https://www.gf.com.cn", title: "GF Securities" },
  { url: "https://www.cmschina.com.cn", title: "China Merchants Securities" },
  { url: "https://www.huatai.com", title: "Huatai Securities" },
  { url: "https://www.orientsecurities.com", title: "Orient Securities" },
  { url: "https://www.everbrightsecurities.com", title: "Everbright Securities" },

  // Insurance & Pension
  { url: "https://www.picc.com.cn", title: "PICC (People's Insurance Company of China)" },
  { url: "https://www.pingan.com", title: "Ping An Insurance" },
  { url: "https://www.chinalife.com.cn", title: "China Life Insurance" },
  { url: "https://www.cpic.com.cn", title: "China Pacific Insurance (CPIC)" },
  { url: "https://www.taikanglife.com", title: "Taikang Insurance" },
  { url: "https://www.aia.com.cn", title: "AIA China" },
  { url: "https://www.prudential.com.cn", title: "Prudential China" },

  // Regulatory Bodies & Policy Institutions
  { url: "https://www.pbc.gov.cn", title: "People's Bank of China (PBOC)" },
  { url: "https://www.cbirc.gov.cn", title: "China Banking and Insurance Regulatory Commission (CBIRC)" },
  { url: "https://www.csrc.gov.cn", title: "China Securities Regulatory Commission (CSRC)" },
  { url: "https://www.safe.gov.cn", title: "State Administration of Foreign Exchange (SAFE)" },
  { url: "https://www.ndrc.gov.cn", title: "National Development and Reform Commission (NDRC)" },
  { url: "https://www.mof.gov.cn", title: "Ministry of Finance" },

  // More Fintech, Consumer Finance & P2P Legacy
  { url: "https://www.lexin.com", title: "LexinFintech" },
  { url: "https://www.qifu.com", title: "Qifu Technology (360 DigiTech)" },
  { url: "https://www.yirendai.com", title: "Yiren Digital" },
  { url: "https://www.fenqile.com", title: "Fenqile (Consumer Finance)" },
    // Finance & Banking – China (Batch 2)
  // More City Commercial Banks
  { url: "https://www.bankofbeijing.com.cn", title: "Bank of Beijing (Alternative)" },
  { url: "https://www.bankofshanghai.com", title: "Bank of Shanghai (Alternative)" },
  { url: "https://www.njcb.com.cn", title: "Bank of Nanjing (Alternative)" },
  { url: "https://www.nbcb.com.cn", title: "Bank of Ningbo (Alternative)" },
  { url: "https://www.hzbank.com.cn", title: "Hangzhou Bank (Alternative)" },
  { url: "https://www.suzhoubank.com", title: "Bank of Suzhou" },
  { url: "https://www.cdrcb.com", title: "Chengdu Rural Commercial Bank" },
  { url: "https://www.jinanbank.com", title: "Bank of Jinan" },
  { url: "https://www.xianbank.com", title: "Bank of Xi'an" },
  { url: "https://www.zzbank.com", title: "Bank of Zhengzhou" },
  { url: "https://www.hrbb.com.cn", title: "Harbin Bank" },
  { url: "https://www.shengjingbank.com", title: "Shengjing Bank" },
  { url: "https://www.bankofdalian.com", title: "Bank of Dalian" },
  { url: "https://www.bankofjiujiang.com", title: "Bank of Jiujiang" },
  { url: "https://www.bankofdongguan.com", title: "Bank of Dongguan" },
  { url: "https://www.bankofkunming.com", title: "Bank of Kunming" },
  { url: "https://www.cscb.cn", title: "Bank of Changsha" },
  { url: "https://www.qdccb.com", title: "Bank of Qingdao" },
  { url: "https://www.wzcb.com.cn", title: "Bank of Wenzhou" },
  { url: "https://www.tzcbank.com.cn", title: "Bank of Taizhou" },
  { url: "https://www.huishangbank.com", title: "Huishang Bank" },
  { url: "https://www.hkb.com.cn", title: "Hankou Bank" },

  // Securities Firms & Brokerages
  { url: "https://www.guotaijunan.com", title: "Guotai Junan Securities (Alternative)" },
  { url: "https://www.haitongsec.com", title: "Haitong Securities (Alternative)" },
  { url: "https://www.orientsec.com.cn", title: "Orient Securities (Alternative)" },
  { url: "https://www.everbrightsec.com", title: "Everbright Securities (Alternative)" },
  { url: "https://www.industrialsec.com.cn", title: "Industrial Securities" },
  { url: "https://www.guosen.com.cn", title: "Guosen Securities" },
  { url: "https://www.westernsec.com", title: "Western Securities" },
  { url: "https://www.soochowsecurities.com", title: "Soochow Securities" },
  { url: "https://www.changjiangsecurities.com", title: "Changjiang Securities" },
  { url: "https://www.minshengsecurities.com", title: "Minsheng Securities" },
  { url: "https://www.pingansecurities.com", title: "Ping An Securities" },
  { url: "https://www.huaxi.com.cn", title: "Huaxi Securities" },

  // Asset Management & Funds
  { url: "https://www.efund.com.cn", title: "E Fund" },
  { url: "https://www.chinauniversal.com", title: "China Universal Asset Management" },
  { url: "https://www.bosera.com", title: "Bosera Asset Management" },
  { url: "https://www.harvest-fund.com", title: "Harvest Fund" },
  { url: "https://www.gffunds.com.cn", title: "GF Fund" },
  { url: "https://www.pinganfund.com", title: "Ping An Fund" },
  { url: "https://www.icbccs.com.cn", title: "ICBC Credit Suisse" },
  { url: "https://www.hsbcjt.com", title: "HSBC Jintrust" },
  { url: "https://www.blackrock.com.cn", title: "BlackRock China" },
    // Finance & Banking – China (Batch 2 continued)
  // Additional Insurance Companies & International Insurers China
  { url: "https://www.allianz.com.cn", title: "Allianz China" },
  { url: "https://www.axa.com.cn", title: "AXA China" },
  { url: "https://www.zurich.com.cn", title: "Zurich China" },
  { url: "https://www.manulife.com.cn", title: "Manulife China" },
  { url: "https://www.sunlife.com.cn", title: "Sun Life China" },
  { url: "https://www.generali.com.cn", title: "Generali China" },
  { url: "https://www.chinare.com.cn", title: "China Re (Reinsurance)" },
  { url: "https://www.cignacmb.com", title: "Cigna & CMC (China)" },

  // Pension, Retirement & Wealth Management
  { url: "https://www.yuebao.com", title: "Yu'e Bao (Ant Group)" },

  // Trust Companies & Specialized Finance
  { url: "https://www.citictrust.com.cn", title: "CITIC Trust" },
  { url: "https://www.chinatrust.com.cn", title: "China Trust" },
  { url: "https://www.pingantrust.com", title: "Ping An Trust" },
  { url: "https://www.huaxiatrust.com", title: "Huaxia Trust" },

  // Additional Credit Rating & Industry Associations
  { url: "https://www.ccxi.com.cn", title: "China Chengxin Credit Rating" },
  { url: "https://www.dagongcredit.com", title: "Dagong Credit Rating" },
    // Finance & Banking – Singapore
  // Major Local & Commercial Banks
  { url: "https://www.dbs.com.sg", title: "DBS Bank" },
  { url: "https://www.uobgroup.com", title: "UOB" },
  { url: "https://www.ocbc.com", title: "OCBC Bank" },
  { url: "https://www.posb.com.sg", title: "POSB (DBS)" },

  // Foreign Banks with Significant Singapore Operations (branches/subsidiaries)
  { url: "https://www.hsbc.com.sg", title: "HSBC Singapore" },
  { url: "https://www.citi.com.sg", title: "Citibank Singapore" },
  { url: "https://www.sc.com", title: "Standard Chartered Singapore" },
  { url: "https://www.abnamro.com.sg", title: "ABN AMRO Singapore" },
  { url: "https://www.barclays.com.sg", title: "Barclays Singapore" },
  { url: "https://www.deutsche-bank.com.sg", title: "Deutsche Bank Singapore" },
  { url: "https://www.bnpparibas.com.sg", title: "BNP Paribas Singapore" },
  { url: "https://www.societegenerale.asia", title: "Société Générale Singapore" },
  { url: "https://www.ing.com.sg", title: "ING Bank Singapore" },
  { url: "https://www.rabobank.com.sg", title: "Rabobank Singapore" },

  // Wealth Management & Private Banking (dedicated pages/offices)
  { url: "https://www.dbs.com.sg/privatebank", title: "DBS Private Bank" },
  { url: "https://www.uobgroup.com/privatebank", title: "UOB Private Bank" },
  { url: "https://www.ocbc.com/privatebank", title: "OCBC Private Bank" },
  { url: "https://www.hsbcprivatebank.com", title: "HSBC Private Banking (Singapore)" },
  { url: "https://www.lgt.com", title: "LGT (Singapore)" },
  { url: "https://www.jsafrasarasin.com", title: "J Safra Sarasin (Singapore)" },
  { url: "https://www.cimb.com.sg", title: "CIMB Private Banking Singapore" },
  { url: "https://www.maybank2u.com.sg", title: "Maybank Private Singapore" },

  // Fintech, Digital Banks & Payment
  { url: "https://www.grab.com", title: "Grab Financial (Singapore)" },
  { url: "https://www.paypal.com.sg", title: "PayPal Singapore" },

  // Insurance & Takaful
  { url: "https://www.aia.com.sg", title: "AIA Singapore" },
  { url: "https://www.prudential.com.sg", title: "Prudential Singapore" },
  { url: "https://www.greateasternlife.com", title: "Great Eastern Singapore" },
  { url: "https://www.income.com.sg", title: "NTUC Income" },
  { url: "https://www.axa.com.sg", title: "AXA Singapore" },
  { url: "https://www.allianz.com.sg", title: "Allianz Singapore" },
  { url: "https://www.zurich.com.sg", title: "Zurich Singapore" },
  { url: "https://www.chubb.com", title: "Chubb Singapore" },
  { url: "https://www.tokiomarine.com.sg", title: "Tokio Marine Singapore" },
  { url: "https://www.sompo.com.sg", title: "Sompo Singapore" },

  // Asset Management, Funds & Sovereign Wealth
  { url: "https://www.temasek.com.sg", title: "Temasek Holdings" },
  { url: "https://www.gic.com.sg", title: "GIC" },

  // Regulatory, Exchanges & Infrastructure
  { url: "https://www.mas.gov.sg", title: "Monetary Authority of Singapore (MAS)" },
  { url: "https://www.sgx.com", title: "Singapore Exchange (SGX)" },
  { url: "https://www.acra.gov.sg", title: "ACRA" },
  { url: "https://www.iras.gov.sg", title: "IRAS" },
  { url: "https://www.cad.gov.sg", title: "Commercial Affairs Department (Financial Crime)" },
    // Finance & Banking – UAE
  // Major Local Commercial Banks
  { url: "https://www.emiratesnbd.com", title: "Emirates NBD" },
  { url: "https://www.mashreqbank.com", title: "Mashreq Bank" },
  { url: "https://www.adcb.com", title: "Abu Dhabi Commercial Bank (ADCB)" },
  { url: "https://www.dubaibank.ae", title: "Dubai Bank (Emirates NBD)" },
  { url: "https://www.rakbank.ae", title: "RAKBANK" },
  { url: "https://www.unitedarabbank.com", title: "United Arab Bank" },
  { url: "https://www.sharjahbank.ae", title: "Sharjah Islamic Bank" },

  // Islamic Banks (Key Players)
  { url: "https://www.dib.ae", title: "Dubai Islamic Bank (DIB)" },
  { url: "https://www.adib.ae", title: "Abu Dhabi Islamic Bank (ADIB)" },
  { url: "https://www.noorbank.ae", title: "Noor Bank (now part of DIB)" },
  { url: "https://www.ajmanbank.ae", title: "Ajman Bank" },

  // Other Notable Banks & Institutions
  { url: "https://www.fab.ae", title: "First Abu Dhabi Bank (FAB)" },
  { url: "https://www.cbd.ae", title: "Commercial Bank of Dubai" },
  { url: "https://www.bankofsharjah.com", title: "Bank of Sharjah" },
  { url: "https://www.nbf.ae", title: "National Bank of Fujairah" },
  { url: "https://www.nbq.ae", title: "National Bank of Umm Al Quwain" },

  // Foreign & International Banks (Major Branches in UAE)
  { url: "https://www.hsbc.ae", title: "HSBC UAE" },
  { url: "https://www.citi.com", title: "Citibank UAE" },
  { url: "https://www.standardchartered.ae", title: "Standard Chartered UAE" },
  { url: "https://www.barclays.ae", title: "Barclays UAE" },
  { url: "https://www.deutschebank.ae", title: "Deutsche Bank UAE" },
  { url: "https://www.bnpparibas.ae", title: "BNP Paribas UAE" },
  { url: "https://www.societegenerale.ae", title: "Société Générale UAE" },

  // Fintech, Payment & Digital
  { url: "https://www.telr.com", title: "Telr (Payments)" },
  { url: "https://www.payfort.com", title: "Payfort (Amazon)" },
  { url: "https://www.nowpay.ae", title: "NowPay" },

  // Insurance & Takaful
  { url: "https://www.adnic.ae", title: "Abu Dhabi National Insurance Company (ADNIC)" },
  { url: "https://www.dubaicinsurance.ae", title: "Dubai Insurance" },
  { url: "https://www.orientinsurance.ae", title: "Orient Insurance" },
  { url: "https://www.takafulemarat.com", title: "Takaful Emarat" },
  { url: "https://www.dnt.ae", title: "Dubai National Takaful" },

  // Regulators, Exchanges & Sovereign/Wealth
  { url: "https://www.centralbank.ae", title: "Central Bank of the UAE (CBUAE)" },
  { url: "https://www.dfsa.ae", title: "Dubai Financial Services Authority (DFSA)" },
  { url: "https://www.sca.gov.ae", title: "Securities and Commodities Authority (SCA)" },
  { url: "https://www.difc.ae", title: "Dubai International Financial Centre (DIFC)" },
  { url: "https://www.adgm.com", title: "Abu Dhabi Global Market (ADGM)" },
  { url: "https://www.mubadala.com", title: "Mubadala Investment Company" },
    // Finance & Banking – South Korea
  // Major Commercial Banks
  { url: "https://www.kbstar.com", title: "KB Kookmin Bank" },
  { url: "https://www.shinhan.com", title: "Shinhan Bank" },
  { url: "https://www.wooribank.com", title: "Woori Bank" },
  { url: "https://www.hana.com", title: "Hana Bank" },
  { url: "https://www.ibk.co.kr", title: "Industrial Bank of Korea (IBK)" },
  { url: "https://www.nhbank.com", title: "NongHyup Bank (NH Bank)" },
  { url: "https://www.suhyup-bank.com", title: "Suhyup Bank" },
  { url: "https://www.jeonbukbank.co.kr", title: "Jeonbuk Bank" },
  { url: "https://www.e-jejubank.co.kr", title: "Jeju Bank" },
  { url: "https://www.bnk.co.kr", title: "BNK Financial Group" },

  // Specialized & Policy Banks
  { url: "https://www.kdb.co.kr", title: "Korea Development Bank (KDB)" },
  { url: "https://www.eximbank.go.kr", title: "Export-Import Bank of Korea" },
  { url: "https://www.kfc.or.kr", title: "Korea Finance Corporation" },

  // Internet-Only & Challenger Banks
  { url: "https://www.kakaobank.com", title: "Kakao Bank" },
  { url: "https://www.tossbank.com", title: "Toss Bank" },

  // Securities & Investment Banks
  { url: "https://www.samsungsecurities.com", title: "Samsung Securities" },
  { url: "https://www.nhqv.com", title: "NH Investment & Securities" },
  { url: "https://www.kiwoom.com", title: "Kiwoom Securities" },
  { url: "https://www.miraeasset.com", title: "Mirae Asset Securities" },

  // Insurance
  { url: "https://www.samsungfire.com", title: "Samsung Fire & Marine Insurance" },
  { url: "https://www.samsunglife.com", title: "Samsung Life Insurance" },
  { url: "https://www.kyobo.com", title: "Kyobo Life Insurance" },
  { url: "https://www.hanwhalife.com", title: "Hanwha Life Insurance" },
  { url: "https://www.dbinsu.com", title: "DB Insurance" },
  { url: "https://www.lotteins.co.kr", title: "Lotte Insurance" },
  { url: "https://www.hyundai-mfire.com", title: "Hyundai Marine & Fire Insurance" },
  { url: "https://www.meritzfire.com", title: "Meritz Fire & Marine Insurance" },
  { url: "https://www.kbinsure.co.kr", title: "KB Insurance" },
  { url: "https://www.shinhanlife.co.kr", title: "Shinhan Life Insurance" },

  // Asset Management & Pension
  { url: "https://www.nps.or.kr", title: "National Pension Service (NPS)" },

  // Fintech, Payment & Digital Finance
  { url: "https://www.kakaopay.com", title: "Kakao Pay" },
  { url: "https://www.toss.im", title: "Toss" },
  { url: "https://pay.naver.com", title: "Naver Pay" },
  { url: "https://www.hyundaicard.com", title: "Hyundai Card" },
  { url: "https://www.lottecard.co.kr", title: "Lotte Card" },
  { url: "https://www.bccard.com", title: "BC Card" },
  { url: "https://www.nice.co.kr", title: "NICE Credit Information" },
  { url: "https://www.kcredit.co.kr", title: "Korea Credit Bureau" },

  // Regulatory & Government Institutions
  { url: "https://www.bok.or.kr", title: "Bank of Korea (BOK)" },
  { url: "https://www.fsc.go.kr", title: "Financial Services Commission (FSC)" },
  { url: "https://www.fss.or.kr", title: "Financial Supervisory Service (FSS)" },
  { url: "https://www.kdic.or.kr", title: "Korea Deposit Insurance Corporation" },
  { url: "https://www.kofiu.go.kr", title: "Korea Financial Intelligence Unit" },
    // Global Finance, Additional Banks & Services (new batch)
  { url: "https://www.tradingview.com", title: "TradingView" },
  { url: "https://www.investing.com", title: "Investing.com" },
  { url: "https://economictimes.com", title: "Economic Times" },
  { url: "https://www.moneycontrol.com", title: "Moneycontrol" },
  { url: "https://www.tbank.ru", title: "Tinkoff Bank" },
  { url: "https://www.rakuten-sec.co.jp", title: "Rakuten Securities" },
  { url: "https://www.poste.it", title: "Poste Italiane" },
  { url: "https://www.trustpilot.com", title: "Trustpilot" },
  { url: "https://finance.yahoo.co.jp", title: "Yahoo Finance Japan" },
  { url: "https://www.nspk.ru", title: "NSPK (Russia)" },
  { url: "https://www.sber.ru", title: "Sber" },
  { url: "https://www.eastmoney.com", title: "East Money" },
  { url: "https://www.caixa.gov.br", title: "Caixa Econômica Federal" },
  { url: "https://www.sberbank.ru", title: "Sberbank" },
  { url: "https://www.groww.in", title: "Groww" },
  { url: "https://www.goodreturns.in", title: "Goodreturns" },
  { url: "https://www.moneyforward.com", title: "Money Forward" },
  { url: "https://www.alfabank.ru", title: "Alfa-Bank" },
  { url: "https://www.kontur.ru", title: "Kontur" },
  { url: "https://www.zerodha.com", title: "Zerodha" },
  { url: "https://www.ideal.nl", title: "iDEAL" },
  { url: "https://www.ameli.fr", title: "Ameli" },
  { url: "https://www.mercadopago.com.ar", title: "Mercado Pago" },
  { url: "https://www.mufg.jp", title: "MUFG Bank" },
  { url: "https://www.bajajfinserv.in", title: "Bajaj Finserv" },
  { url: "https://www.adyen.com", title: "Adyen" },
  { url: "https://www.vtb.ru", title: "VTB Bank" },
  { url: "https://www.razorpay.com", title: "Razorpay" },

  // Global banks not yet added
  { url: "https://www.bnpparibas.com", title: "BNP Paribas" },
  { url: "https://www.credit-agricole.com", title: "Crédit Agricole" },
  { url: "https://www.santander.com", title: "Banco Santander" },
  { url: "https://www.bankcomm.com", title: "Bank of Communications" },
  { url: "https://www.barclays.com", title: "Barclays" },
  { url: "https://www.smbcgroup.com", title: "SMBC Group" },
  { url: "https://www.societegenerale.com", title: "Société Générale" },
  { url: "https://www.mizuhogroup.com", title: "Mizuho Financial Group" },
  { url: "https://www.bpce.fr", title: "Groupe BPCE" },
  { url: "https://www.rbc.com", title: "Royal Bank of Canada" },
  { url: "https://www.db.com", title: "Deutsche Bank" },
  { url: "https://www.japanpost.jp", title: "Japan Post Bank" },
  { url: "https://www.creditmutuel.fr", title: "Crédit Mutuel" },
  { url: "https://www.shanghaipudong.com", title: "SPD Bank" },
  { url: "https://www.ing.com", title: "ING" },
  { url: "https://www.intesasanpaolo.com", title: "Intesa Sanpaolo" },
  { url: "https://www.scotiabank.com", title: "Scotiabank" },
  { url: "https://www.cnbc.com", title: "CNBC" },
  { url: "https://www.mint.com", title: "Mint" },

  // Japan-focused additions
  { url: "https://www.boj.or.jp", title: "Bank of Japan" },
  { url: "https://www.smbc.co.jp", title: "SMBC Bank" },
  { url: "https://www.rakuten-bank.co.jp", title: "Rakuten Bank" },
  { url: "https://www.sonybank.jp", title: "Sony Bank" },
  { url: "https://www.shinsei.co.jp", title: "SBI Shinsei Bank" },
  { url: "https://www.resona-gr.co.jp", title: "Resona Bank" },
  { url: "https://www.jbic.go.jp", title: "Japan Bank for International Cooperation" },
  { url: "https://www.dbj.jp", title: "Development Bank of Japan" },
    // China Finance – Batch 3 (additional banks, fintech, securities, media)
  // Additional Bank Domains (new or alternate official)
  { url: "https://www.ibc.com.cn", title: "Industrial Bank (CIB) - alternative" },
  { url: "https://www.bob.com.cn", title: "Bank of Beijing (alternative)" },
  { url: "https://www.bjb.com.cn", title: "Bank of Jiangsu" },
  { url: "https://www.bankofnb.com", title: "Bank of Ningbo (alternative)" },
  { url: "https://www.czbank.com", title: "China Zheshang Bank" },
  { url: "https://www.gfbank.com.cn", title: "China Guangfa Bank" },

  // Fintech, Investing & Portals
  { url: "https://www.10jqka.com.cn", title: "Tonghuashun (East Money related)" },
  { url: "https://finance.sina.com.cn", title: "Sina Finance" },
  { url: "https://www.hexun.com", title: "Hexun" },
  { url: "https://www.jrj.com.cn", title: "JRJ Financial" },
  { url: "https://www.taikang.com", title: "Taikang Insurance & Finance Group" },
  { url: "https://www.zhongan.com", title: "ZhongAn Online Insurance" },
  { url: "https://www.51credit.com", title: "51 Credit Card" },

  // Securities & Brokerages
  { url: "https://www.htsec.com", title: "Haitong Securities" },
  { url: "https://www.citics.com", title: "CITIC Securities" },
  { url: "https://www.csc108.com", title: "CSC Financial" },
  { url: "https://www.foundersec.com", title: "Founder Securities" },
  { url: "https://www.swsresearch.com", title: "Shenyin Wanguo Research" },
  { url: "https://www.xyzq.com.cn", title: "Xingye Securities" },

  // Finance News & Media Sites
  { url: "https://money.163.com", title: "NetEase Finance" },
  { url: "https://finance.ifeng.com", title: "iFeng Finance" },
  { url: "https://www.caijing.com.cn", title: "Caijing" },
  { url: "https://www.yicai.com", title: "Yicai" },
  { url: "https://www.stcn.com", title: "Securities Times" },
  { url: "https://www.cnstock.com", title: "China Securities Journal" },
  { url: "https://www.xinhuanet.com/finance", title: "Xinhua Finance" },
  { url: "http://finance.people.com.cn", title: "People's Daily Finance" },
    // Japan – Additional Specialized & Regional Banks
  { url: "https://www.prestia.jp", title: "SMBC Trust Bank PRESTIA" },
  { url: "https://www.nomura.com", title: "Nomura Holdings" },
  { url: "https://www.daiwa-grp.jp", title: "Daiwa Securities Group" },
  { url: "https://www.smth.jp", title: "Sumitomo Mitsui Trust Holdings" },
  { url: "https://www.zenginkyo.or.jp", title: "Japanese Bankers Association" },
  { url: "https://www.boy.co.jp", title: "Bank of Yokohama" },
  { url: "https://www.shizuokabank.co.jp", title: "Shizuoka Bank" },

  // Global/International Banks (not yet added)
  { url: "https://www.hsbc.com", title: "HSBC (Global)" },
  { url: "https://www.natwestgroup.com", title: "NatWest Group" },
  { url: "https://www.standardchartered.com", title: "Standard Chartered" },
  { url: "https://www.unicreditgroup.eu", title: "UniCredit" },
  { url: "https://www.commerzbank.com", title: "Commerzbank" },

  // Australia/New Zealand
  { url: "https://www.nab.com.au", title: "National Australia Bank" },
  { url: "https://www.westpac.com.au", title: "Westpac" },
  { url: "https://www.cba.com.au", title: "Commonwealth Bank of Australia" },
  { url: "https://www.anz.com", title: "ANZ Group" },

  // India – Major Banks
  { url: "https://www.sbi.co.in", title: "State Bank of India" },
  { url: "https://www.hdfcbank.com", title: "HDFC Bank" },
  { url: "https://www.icicibank.com", title: "ICICI Bank" },
  { url: "https://www.axisbank.com", title: "Axis Bank" },

  // Brazil – Major Banks
  { url: "https://www.itau.com.br", title: "Itaú Unibanco" },
  { url: "https://www.bradesco.com.br", title: "Banco Bradesco" },

  // Fintech/Neobank (new)
  { url: "https://www.nu.com", title: "Nubank (Brazil/Global)" },
    // Finance – Switzerland
  // Cantonal, Private & Cooperative Banks
  { url: "https://www.raiffeisen.ch", title: "Raiffeisen Group Switzerland" },
  { url: "https://www.zkb.ch", title: "Zürcher Kantonalbank" },
  { url: "https://www.bcv.ch", title: "Banque Cantonale Vaudoise" },
  { url: "https://www.luzernerkantonalbank.ch", title: "Luzerner Kantonalbank" },
  { url: "https://www.baslerkantonalbank.ch", title: "Basler Kantonalbank" },
  { url: "https://www.sgkb.ch", title: "St. Galler Kantonalbank" },
  { url: "https://www.bkb.ch", title: "Berner Kantonalbank" },
  { url: "https://www.gkb.ch", title: "Graubündner Kantonalbank" },
  { url: "https://www.juliusbaer.com", title: "Julius Baer Group" },
  { url: "https://www.pictet.com", title: "Pictet Group" },
  { url: "https://www.lombardodier.com", title: "Lombard Odier" },
  { url: "https://www.mirabaud.com", title: "Mirabaud Group" },
  { url: "https://www.efginternational.com", title: "EFG International" },
  { url: "https://www.gonet.com", title: "Gonet & Cie" },
  { url: "https://www.reichmuthco.ch", title: "Reichmuth & Co" },
  { url: "https://www.bsi.ch", title: "BSI (now part of EFG)" },
  { url: "https://www.bankhapoalim.ch", title: "Bank Hapoalim Switzerland" },
  { url: "https://www.habibbank.com", title: "Habib Bank AG Zurich" },

  // Asset Management, Securities & Investment
  { url: "https://www.swissquote.com", title: "Swissquote" },
  { url: "https://www.vontobel.com", title: "Vontobel" },
  { url: "https://www.partnersgroup.com", title: "Partners Group" },
  { url: "https://www.gam.com", title: "GAM Investments" },
  { url: "https://www.swisscanto.com", title: "Swisscanto" },
  { url: "https://www.zurich.com", title: "Zurich Insurance Group" },
  { url: "https://www.swisslife.com", title: "Swiss Life" },
  { url: "https://www.baloise.com", title: "Baloise" },
  { url: "https://www.helvetia.com", title: "Helvetia Insurance" },
  { url: "https://www.vaudoise.ch", title: "Vaudoise Assurances" },

  // Fintech, Payments & Digital Finance
  { url: "https://www.twint.ch", title: "TWINT (Swiss mobile payments)" },
  { url: "https://www.postfinance.ch", title: "PostFinance" },
  { url: "https://www.cornertrader.ch", title: "Cornèrtrader" },
  { url: "https://www.finma.ch", title: "FINMA" },
  { url: "https://www.snb.ch", title: "Swiss National Bank" },
  { url: "https://www.six-group.com", title: "SIX Group" },
  { url: "https://www.sis.ch", title: "SIX SIS" },

  // Insurance (Swiss branches)
  { url: "https://www.allianz.ch", title: "Allianz Switzerland" },
  { url: "https://www.axa.ch", title: "AXA Switzerland" },
  { url: "https://www.generali.ch", title: "Generali Switzerland" },
  { url: "https://www.mobiliar.ch", title: "Die Mobiliar" },

  // Industry & Regulatory
  { url: "https://www.swissbanking.ch", title: "Swiss Bankers Association" },
    // Finance – Germany
  // Private & Commercial Banks
  { url: "https://www.postbank.de", title: "Postbank" },
  { url: "https://www.hypovereinsbank.de", title: "HypoVereinsbank (UniCredit)" },
  { url: "https://www.ing.de", title: "ING Germany" },
  { url: "https://www.targobank.de", title: "Targobank" },
  { url: "https://www.deutsche-apotheker-und-aerztebank.de", title: "Deutsche Apotheker- und Ärztebank" },
  { url: "https://www.dzbank.com", title: "DZ Bank" },
  { url: "https://www.lbbw.de", title: "Landesbank Baden-Württemberg (LBBW)" },
  { url: "https://www.bayernlb.de", title: "BayernLB" },
  { url: "https://www.helaba.de", title: "Helaba" },
  { url: "https://www.nordlb.de", title: "NORD/LB" },
  { url: "https://www.hsh-nordbank.de", title: "HSH Nordbank (legacy)" },
  { url: "https://www.dekabank.de", title: "DekaBank" },
  { url: "https://www.pbb.de", title: "Deutsche Pfandbriefbank" },
  { url: "https://www.aareal-bank.com", title: "Aareal Bank" },
  { url: "https://www.bunq.com", title: "bunq Germany" },
  { url: "https://www.comdirect.de", title: "comdirect" },
  { url: "https://www.consorsbank.de", title: "Consorsbank" },
  { url: "https://www.norisbank.de", title: "Norisbank" },
  { url: "https://www.swk-bank.de", title: "SWK Bank" },
  { url: "https://www.creditplus.de", title: "CreditPlus" },

  // Sparkassen (Savings Banks) – umbrella and major ones
  { url: "https://www.sparkasse.de", title: "Sparkassen Finanzgruppe" },
  { url: "https://www.haspa.de", title: "Hamburger Sparkasse" },
  { url: "https://www.sparkasse-koelnbonn.de", title: "Sparkasse KölnBonn" },
  { url: "https://www.ksk-koeln.de", title: "Kreissparkasse Köln" },
  { url: "https://www.frankfurter-sparkasse.de", title: "Frankfurter Sparkasse" },
  { url: "https://www.sparkasse-muenchen.de", title: "Stadtsparkasse München" },
  { url: "https://www.berliner-sparkasse.de", title: "Berliner Sparkasse" },
  { url: "https://www.sparkasse-hannover.de", title: "Sparkasse Hannover" },

  // Fintech, Brokers & Digital Banks
  { url: "https://www.trade-republic.com", title: "Trade Republic" },
  { url: "https://www.tomorrow.one", title: "Tomorrow Bank" },
  { url: "https://www.c24.de", title: "C24 Bank" },
  { url: "https://www.vivid.money", title: "Vivid Money" },
  { url: "https://www.finanzcheck.de", title: "Finanzcheck" },
  { url: "https://www.check24.de", title: "Check24 (Finanzen)" },

  // Central Bank, Regulator & Associations
  { url: "https://www.bundesbank.de", title: "Deutsche Bundesbank" },
  { url: "https://www.bafin.de", title: "BaFin (Financial Supervisor)" },
  { url: "https://www.dsgv.de", title: "Deutscher Sparkassen- und Giroverband" },
  { url: "https://www.bvr.de", title: "BVR (Cooperative Banks Association)" },
    // Germany – Additional Sparkassen, Cooperatives, Bausparkassen, Fintech, etc.
  // Additional Sparkassen (new regional examples)
  { url: "https://www.sparkasse-leipzig.de", title: "Sparkasse Leipzig" },
  { url: "https://www.sparkasse-dortmund.de", title: "Sparkasse Dortmund" },
  { url: "https://www.sparkasse-essen.de", title: "Sparkasse Essen" },
  { url: "https://www.ksk-heidenheim.de", title: "Kreissparkasse Heidenheim" },
  { url: "https://www.sparkasse-ro-bad-aibling.de", title: "Sparkasse Rosenheim-Bad Aibling" },
  { url: "https://www.sparkasse-duisburg.de", title: "Sparkasse Duisburg" },
  { url: "https://www.sparkasse-cuxhaven.de", title: "Stadtsparkasse Cuxhaven" },
  { url: "https://www.sparkasse-burgdorf.de", title: "Sparkasse Burgdorf" },

  // Cooperative Banks (umbrellas & major local examples)
  { url: "https://www.volksbank.de", title: "Volksbanken Raiffeisenbanken (umbrella)" },
  { url: "https://www.berliner-volksbank.de", title: "Berliner Volksbank" },
  { url: "https://www.frankfurter-volksbank.de", title: "Frankfurter Volksbank" },
  { url: "https://www.raiffeisen.de", title: "Raiffeisenbanken (umbrella)" },

  // Bausparkassen, Insurance Finance & Development Banks
  { url: "https://www.schwaebisch-hall.de", title: "Bausparkasse Schwäbisch Hall" },
  { url: "https://www.lbs.de", title: "Landesbausparkassen (LBS umbrella)" },
  { url: "https://www.allianz.de", title: "Allianz Deutschland" },
  { url: "https://www.muenchener-rueck.de", title: "Munich Re" },
  { url: "https://www.axa.de", title: "AXA Deutschland" },
  { url: "https://www.generali.de", title: "Generali Deutschland" },
  { url: "https://www.kfw.de", title: "KfW (development bank)" },
  { url: "https://www.nrwbank.de", title: "NRW.BANK" },

  // Fintech, Brokers & Specialized (new or alternate domains)
  { url: "https://www.dws.com", title: "DWS Group (asset management)" },
  { url: "https://www.deutsche-bank.de", title: "Deutsche Bank (Retail)" },
  { url: "https://www.commerzbank.de", title: "Commerzbank (Retail)" },
    // Germany – Additional Sparkassen, Cooperatives, Insurance & Bausparkassen
  { url: "https://www.sparkasse-dresden.de", title: "Sparkasse Dresden" },
  { url: "https://www.sparkasse-chemnitz.de", title: "Sparkasse Chemnitz" },
  { url: "https://www.sparkasse-bielefeld.de", title: "Sparkasse Bielefeld" },
  { url: "https://www.sparkasse-muensterland.de", title: "Sparkasse Münsterland" },
  { url: "https://www.sparkasse-paderborn.de", title: "Sparkasse Paderborn" },
  { url: "https://www.sparkasse-bochum.de", title: "Sparkasse Bochum" },
  { url: "https://www.volksbank-koeln-bonn.de", title: "Volksbank Köln Bonn" },
  { url: "https://www.volksbank-stuttgart.de", title: "Volksbank Stuttgart" },
  { url: "https://www.lbs-bw.de", title: "LBS Baden-Württemberg" },
  { url: "https://www.lbs-bayern.de", title: "LBS Bayern" },
  { url: "https://www.talanx.de", title: "Talanx Group" },
  { url: "https://www.ergo.de", title: "ERGO Insurance" },
  { url: "https://www.signal-iduna.de", title: "Signal Iduna" },
  { url: "https://www.ruv.de", title: "R+V Versicherung" },
  { url: "https://www.deutsche-bausparkassen.de", title: "Deutsche Bausparkassen (umbrella)" },
    // Germany – Additional Regional Sparkassen, Cooperatives, Development Banks, Fintech & Insurance
  { url: "https://www.sparkasse-mainfranken.de", title: "Sparkasse Mainfranken" },
  { url: "https://www.sparkasse-nuernberg.de", title: "Sparkasse Nürnberg" },
  { url: "https://www.sparkasse-regensburg.de", title: "Sparkasse Regensburg" },
  { url: "https://www.sparkasse-augsburg.de", title: "Sparkasse Augsburg" },
  { url: "https://www.sparkasse-mittelholstein.de", title: "Sparkasse Mittelholstein" },
  { url: "https://www.sparkasse-kiel.de", title: "Sparkasse Kiel" },
  { url: "https://www.sparkasse-flensburg.de", title: "Sparkasse Flensburg" },
  { url: "https://www.sparkasse-bremen.de", title: "Sparkasse Bremen" },
  { url: "https://www.sparkasse-oldenburg.de", title: "Sparkasse Oldenburg" },
  { url: "https://www.sparkasse-osnabrueck.de", title: "Sparkasse Osnabrück" },

  // Cooperative Banks (new)
  { url: "https://www.volksbank-rhein-ruhr.de", title: "Volksbank Rhein-Ruhr" },
  { url: "https://www.volksbank-rhein-main.de", title: "Volksbank Rhein-Main" },
  { url: "https://www.raiffeisenbank-muenchen.de", title: "Raiffeisenbank München" },

  // Development Banks & Investment Institutions
  { url: "https://www.investitionsbank-berlin.de", title: "Investitionsbank Berlin" },
  { url: "https://www.ilb.de", title: "ILB (Investitionsbank des Landes Brandenburg)" },
  { url: "https://www.sab.sachsen.de", title: "Sächsische Aufbaubank (SAB)" },
  { url: "https://www.ibb.de", title: "Investitionsbank Berlin (IBB)" },

  // Fintech, Brokers & Portals
  { url: "https://www.scalable.capital", title: "Scalable Capital" },
  { url: "https://www.justtrade.de", title: "justTRADE" },
  { url: "https://www.finanzen.net", title: "finanzen.net" },
  { url: "https://www.onvista.de", title: "OnVista" },
  { url: "https://www.boerse.de", title: "Börse.de" },
  { url: "https://www.wallstreet-online.de", title: "Wallstreet Online" },
  { url: "https://www.union-investment.de", title: "Union Investment" },
  { url: "https://www.deka.de", title: "Deka (Asset Management)" },

  // Insurers with Finance Arms
  { url: "https://www.huk.de", title: "HUK-Coburg" },
  { url: "https://www.lvm.de", title: "LVM Versicherung" },
  { url: "https://www.vgh.de", title: "VGH Versicherungen" },
  { url: "https://www.provinzial.de", title: "Provinzial" },
    // Germany – Additional Regional Sparkassen, Cooperative Banks, and Exchange
  { url: "https://www.sparkasse-guetersloh.de", title: "Sparkasse Gütersloh" },
  { url: "https://www.sparkasse-owl.de", title: "Sparkasse Ostwestfalen-Lippe" },
  { url: "https://www.sparkasse-minden.de", title: "Sparkasse Minden" },
  { url: "https://www.sparkasse-herford.de", title: "Sparkasse Herford" },
  { url: "https://www.sparkasse-detmold.de", title: "Sparkasse Detmold" },
  { url: "https://www.sparkasse-hildesheim.de", title: "Sparkasse Hildesheim" },
  { url: "https://www.sparkasse-goslar.de", title: "Sparkasse Goslar" },
  { url: "https://www.sparkasse-peine.de", title: "Sparkasse Peine" },

  { url: "https://www.volksbank-mittelhessen.de", title: "Volksbank Mittelhessen" },
  { url: "https://www.volksbank-kassel.de", title: "Volksbank Kassel" },
  { url: "https://www.volksbank-freiburg.de", title: "Volksbank Freiburg" },
  { url: "https://www.volksbank-tuebingen.de", title: "Volksbank Tübingen" },

  { url: "https://www.boerse-stuttgart.de", title: "Börse Stuttgart" },
    // Finance – France
  // Major Retail and Cooperative Banks (new)
  { url: "https://www.cic.fr", title: "CIC (Crédit Mutuel)" },
  { url: "https://www.la-banque-postale.fr", title: "La Banque Postale" },
  { url: "https://www.boursorama.com", title: "Boursorama (Société Générale)" },
  { url: "https://www.fortuneo.fr", title: "Fortuneo (Crédit Mutuel Arkéa)" },
  { url: "https://www.ing.fr", title: "ING France" },
  { url: "https://www.lcl.fr", title: "LCL (Crédit Agricole)" },
  { url: "https://www.hsbc.fr", title: "HSBC France" },
  { url: "https://www.banque-fiducial.fr", title: "Banque Fiducial" },
  { url: "https://www.banque-transatlantique.fr", title: "Banque Transatlantique" },
  { url: "https://www.oddo-bhf.com", title: "Oddo BHF" },
  { url: "https://www.caceis.com", title: "CACEIS" },

  // Fintech, Online & Digital Banks
  { url: "https://www.nickel.fr", title: "Nickel (BNP Paribas)" },
  { url: "https://www.anytime.fr", title: "Anytime" },
  { url: "https://www.sogelease.fr", title: "Sogelease" },
  { url: "https://www.bforbank.com", title: "BforBank (Crédit Agricole)" },
  { url: "https://www.monabanq.com", title: "Monabanq (Crédit Mutuel)" },
  { url: "https://www.hellobank.fr", title: "Hello bank! (BNP Paribas)" },
  { url: "https://www.orangebank.fr", title: "Orange Bank" },

  // Insurance
  { url: "https://www.axa.fr", title: "AXA France" },
  { url: "https://www.allianz.fr", title: "Allianz France" },
  { url: "https://www.generali.fr", title: "Generali France" },
  { url: "https://www.cnp.fr", title: "CNP Assurances" },
  { url: "https://www.groupama.com", title: "Groupama" },
  { url: "https://www.maif.fr", title: "MAIF" },
  { url: "https://www.macif.fr", title: "MACIF" },

  // Asset Management & Investment
  { url: "https://www.amundi.com", title: "Amundi" },
  { url: "https://www.natixis.com", title: "Natixis (BPCE)" },
  { url: "https://www.lyxor.com", title: "Lyxor (now Amundi)" },
  { url: "https://www.bnpparibas-am.com", title: "BNP Paribas Asset Management" },
  { url: "https://www.credit-agricole-assurances.fr", title: "Crédit Agricole Assurances" },

  // Regulatory, Markets & Other
  { url: "https://www.banque-france.fr", title: "Banque de France" },
  { url: "https://acpr.banque-france.fr", title: "ACPR (Prudential Supervisor)" },
  { url: "https://www.amf-france.org", title: "AMF (Financial Markets Authority)" },
  { url: "https://www.euronext.com", title: "Euronext" },
  { url: "https://www.boursedeparis.fr", title: "Bourse de Paris" },
  { url: "https://www.finance.gouv.fr", title: "French Ministry of Finance" },

    // Tech News & Media (new additions)
  { url: "https://www.venturebeat.com", title: "VentureBeat" },
  { url: "https://www.protocol.com", title: "Protocol" },
  { url: "https://www.recode.net", title: "Recode (Vox)" },
  { url: "https://www.mashable.com", title: "Mashable" },
  { url: "https://www.gizmodo.com", title: "Gizmodo" },
  { url: "https://www.tomshardware.com", title: "Tom's Hardware" },
  { url: "https://www.anandtech.com", title: "AnandTech" },

  // Developer Resources & Communities (new)
  { url: "https://developer.mozilla.org", title: "MDN Web Docs" },
  { url: "https://docs.microsoft.com", title: "Microsoft Learn" },
  { url: "https://www.dev.to", title: "DEV Community" },
  { url: "https://www.hackernoon.com", title: "Hacker Noon" },
  { url: "https://www.freecodecamp.org", title: "freeCodeCamp" },
  { url: "https://www.codecademy.com", title: "Codecademy" },
  { url: "https://www.leetcode.com", title: "LeetCode" },
  { url: "https://www.coursera.org", title: "Coursera" },
  { url: "https://www.gitlab.com", title: "GitLab" },
  { url: "https://www.bitbucket.org", title: "Bitbucket" },
  { url: "https://www.codepen.io", title: "CodePen" },
  { url: "https://www.jsfiddle.net", title: "JSFiddle" },
  { url: "https://www.w3schools.com", title: "W3Schools" },
  { url: "https://www.geeksforgeeks.org", title: "GeeksforGeeks" },

  // Cloud Services & Infrastructure
  { url: "https://aws.amazon.com", title: "Amazon Web Services (AWS)" },
  { url: "https://cloud.google.com", title: "Google Cloud" },
  { url: "https://azure.microsoft.com", title: "Microsoft Azure" },
  { url: "https://cloud.oracle.com", title: "Oracle Cloud" },
  { url: "https://www.ibm.com/cloud", title: "IBM Cloud" },
  { url: "https://www.digitalocean.com", title: "DigitalOcean" },
  { url: "https://www.heroku.com", title: "Heroku" },
  { url: "https://www.vercel.com", title: "Vercel" },
  { url: "https://www.netlify.com", title: "Netlify" },
  { url: "https://firebase.google.com", title: "Firebase" },
  { url: "https://www.linode.com", title: "Linode" },
  { url: "https://www.vultr.com", title: "Vultr" },
  { url: "https://www.rackspace.com", title: "Rackspace" },
  { url: "https://www.akamai.com", title: "Akamai" },
  { url: "https://www.cloudflare.com", title: "Cloudflare" },

  // Big Tech Developer Portals
  { url: "https://developer.apple.com", title: "Apple Developer" },
  { url: "https://developer.android.com", title: "Android Developers" },
  { url: "https://developers.facebook.com", title: "Meta for Developers" },
  { url: "https://developer.microsoft.com", title: "Microsoft Developer" },
  { url: "https://www.oracle.com/developers", title: "Oracle Developers" },
  { url: "https://www.sap.com", title: "SAP" },
  { url: "https://www.salesforce.com", title: "Salesforce" },
  { url: "https://www.adobe.com/developer", title: "Adobe Developer" },

  // Tools, Productivity & Software
  { url: "https://www.notion.so", title: "Notion" },
  { url: "https://www.slack.com", title: "Slack" },
  { url: "https://www.zoom.us", title: "Zoom" },
  { url: "https://www.trello.com", title: "Trello" },
  { url: "https://www.jira.atlassian.com", title: "Jira" },
  { url: "https://www.confluence.atlassian.com", title: "Confluence" },
  { url: "https://www.figma.com", title: "Figma" },
  { url: "https://www.canva.com", title: "Canva" },
  { url: "https://www.dropbox.com", title: "Dropbox" },
  { url: "https://drive.google.com", title: "Google Drive" },

    // Productivity, Collaboration & Enterprise Software (new)
  { url: "https://www.asana.com", title: "Asana" },
  { url: "https://www.monday.com", title: "Monday.com" },
  { url: "https://www.airtable.com", title: "Airtable" },
  { url: "https://www.basecamp.com", title: "Basecamp" },
  { url: "https://onedrive.live.com", title: "Microsoft OneDrive" },
  { url: "https://www.box.com", title: "Box" },
  { url: "https://www.evernote.com", title: "Evernote" },
  { url: "https://www.todoist.com", title: "Todoist" },
  { url: "https://www.linear.app", title: "Linear" },
  { url: "https://www.clickup.com", title: "ClickUp" },
  { url: "https://www.oracle.com", title: "Oracle" },
  { url: "https://www.workday.com", title: "Workday" },
  { url: "https://www.servicenow.com", title: "ServiceNow" },

  // AI, Machine Learning & Data Science
  { url: "https://www.openai.com", title: "OpenAI" },
  { url: "https://huggingface.co", title: "Hugging Face" },
  { url: "https://www.tensorflow.org", title: "TensorFlow" },
  { url: "https://www.pytorch.org", title: "PyTorch" },
  { url: "https://keras.io", title: "Keras" },
  { url: "https://scikit-learn.org", title: "scikit-learn" },
  { url: "https://www.paperswithcode.com", title: "Papers With Code" },
  { url: "https://arxiv.org", title: "arXiv" },
  { url: "https://www.deepmind.com", title: "DeepMind" },
  { url: "https://www.anthropic.com", title: "Anthropic" },
  { url: "https://stability.ai", title: "Stability AI" },
  { url: "https://www.midjourney.com", title: "Midjourney" },
  { url: "https://runwayml.com", title: "Runway ML" },
  { url: "https://www.databricks.com", title: "Databricks" },
  { url: "https://www.snowflake.com", title: "Snowflake" },

  // Cybersecurity & Privacy
  { url: "https://www.crowdstrike.com", title: "CrowdStrike" },
  { url: "https://www.paloaltonetworks.com", title: "Palo Alto Networks" },
  { url: "https://www.fortinet.com", title: "Fortinet" },
  { url: "https://www.checkpoint.com", title: "Check Point" },
  { url: "https://www.kaspersky.com", title: "Kaspersky" },
  { url: "https://www.malwarebytes.com", title: "Malwarebytes" },
  { url: "https://www.wireshark.org", title: "Wireshark" },
  { url: "https://haveibeenpwned.com", title: "Have I Been Pwned" },
  { url: "https://www.eff.org", title: "Electronic Frontier Foundation" },
  { url: "https://www.privacytools.io", title: "PrivacyTools" },
  { url: "https://www.expressvpn.com", title: "ExpressVPN" },
  { url: "https://www.nordvpn.com", title: "NordVPN" },

  // Hardware, Gadgets & Semiconductor
  { url: "https://www.pcmag.com", title: "PCMag" },
  { url: "https://www.techradar.com", title: "TechRadar" },
  { url: "https://www.intel.com", title: "Intel" },
  { url: "https://www.amd.com", title: "AMD" },
  { url: "https://www.nvidia.com", title: "NVIDIA" },
  { url: "https://www.qualcomm.com", title: "Qualcomm" },

  // Open Source, Hosting & DevOps (new)
  { url: "https://www.docker.com", title: "Docker" },
  { url: "https://kubernetes.io", title: "Kubernetes" },
  { url: "https://www.ansible.com", title: "Ansible" },
  { url: "https://www.terraform.io", title: "Terraform (HashiCorp)" },
  { url: "https://www.jenkins.io", title: "Jenkins" },
  { url: "https://www.circleci.com", title: "CircleCI" },
  { url: "https://www.travis-ci.com", title: "Travis CI" },
  { url: "https://www.fastly.com", title: "Fastly" },

    // Gaming Tech & Entertainment Software
  { url: "https://www.ign.com", title: "IGN" },
  { url: "https://www.polygon.com", title: "Polygon" },
  { url: "https://www.kotaku.com", title: "Kotaku" },
  { url: "https://www.eurogamer.net", title: "Eurogamer" },
  { url: "https://www.rockpapershotgun.com", title: "Rock Paper Shotgun" },
  { url: "https://www.unity.com", title: "Unity Technologies" },
  { url: "https://www.unrealengine.com", title: "Unreal Engine" },
  { url: "https://www.xbox.com", title: "Xbox" },
  { url: "https://www.playstation.com", title: "PlayStation" },
  { url: "https://www.nintendo.com", title: "Nintendo" },

  // IoT, Robotics & Emerging Tech
  { url: "https://iot.ibm.com", title: "IBM IoT" },
  { url: "https://iot.google.com", title: "Google IoT" },
  { url: "https://www.arduino.cc", title: "Arduino" },
  { url: "https://www.raspberrypi.com", title: "Raspberry Pi" },
  { url: "https://www.ros.org", title: "ROS (Robot Operating System)" },
  { url: "https://www.bostondynamics.com", title: "Boston Dynamics" },
  { url: "https://www.irobot.com", title: "iRobot" },

  // Cybersecurity Expansions & Privacy Tools
  { url: "https://www.splunk.com", title: "Splunk" },
  { url: "https://www.elastic.co", title: "Elastic" },
  { url: "https://www.mcafee.com", title: "McAfee" },
  { url: "https://www.norton.com", title: "Norton" },
  { url: "https://www.proton.me", title: "Proton (Privacy)" },
  { url: "https://www.torproject.org", title: "Tor Project" },

  // Education, Learning & Certification Platforms
  { url: "https://www.udacity.com", title: "Udacity" },
  { url: "https://www.udemy.com", title: "Udemy" },
  { url: "https://www.pluralsight.com", title: "Pluralsight" },
  { url: "https://www.linkedin.com/learning", title: "LinkedIn Learning" },
  { url: "https://www.khanacademy.org", title: "Khan Academy" },
  { url: "https://www.edx.org", title: "edX" },
  { url: "https://www.acloud.guru", title: "A Cloud Guru" },
  { url: "https://www.linuxfoundation.org", title: "Linux Foundation" },
  { url: "https://www.aws.training", title: "AWS Training" },

  // Miscellaneous Tech Tools & Repositories
  { url: "https://www.postman.com", title: "Postman" },
  { url: "https://www.swagger.io", title: "Swagger" },
  { url: "https://www.maven.apache.org", title: "Maven Repository" },
  { url: "https://www.nuget.org", title: "NuGet" },
  { url: "https://www.dockerhub.com", title: "Docker Hub" },

    // Blockchain, Crypto & Web3 (new domains)
  { url: "https://www.coindesk.com", title: "CoinDesk" },
  { url: "https://ethereum.org", title: "Ethereum" },
  { url: "https://bitcoin.org", title: "Bitcoin" },
  { url: "https://solana.com", title: "Solana" },
  { url: "https://polygon.technology", title: "Polygon" },
  { url: "https://chain.link", title: "Chainlink" },
  { url: "https://web3.foundation", title: "Web3 Foundation" },

  // Quantum Computing & Advanced Research
  { url: "https://quantum.ibm.com", title: "IBM Quantum" },
  { url: "https://quantum.google.com", title: "Google Quantum AI" },
  { url: "https://www.rigetti.com", title: "Rigetti Computing" },
  { url: "https://www.ionq.com", title: "IonQ" },
  { url: "https://www.quantinuum.com", title: "Quantinuum" },
  { url: "https://www.microsoft.com/quantum", title: "Microsoft Quantum" },

  // Mobile Development & App Ecosystems (new)
  { url: "https://flutter.dev", title: "Flutter" },
  { url: "https://reactnative.dev", title: "React Native" },
  { url: "https://developer.xcodeclub.com", title: "Xcode (Apple)" }, // actual: developer.apple.com/xcode but using xcode.apple.com
  { url: "https://play.google.com/console", title: "Google Play Console" },
  { url: "https://appstoreconnect.apple.com", title: "App Store Connect" },

  // SaaS, CRM & Business Software (new)
  { url: "https://www.hubspot.com", title: "HubSpot" },
  { url: "https://www.zendesk.com", title: "Zendesk" },
  { url: "https://www.dynamics.microsoft.com", title: "Microsoft Dynamics" },
  { url: "https://www.zoho.com", title: "Zoho" },
  { url: "https://www.freshworks.com", title: "Freshworks" },

  // Design, No-Code & Creative Tech (new)
  { url: "https://www.adobe.com", title: "Adobe" },
  { url: "https://www.sketch.com", title: "Sketch" },
  { url: "https://www.invisionapp.com", title: "InVision" },
  { url: "https://www.webflow.com", title: "Webflow" },
  { url: "https://www.bubble.io", title: "Bubble" },
  { url: "https://www.adalo.com", title: "Adalo" },
  { url: "https://www.glideapps.com", title: "Glide" },
  { url: "https://www.framer.com", title: "Framer" },

  // Data, Analytics & BI Tools (new)
  { url: "https://www.tableau.com", title: "Tableau" },
  { url: "https://www.powerbi.microsoft.com", title: "Power BI" },
  { url: "https://www.looker.com", title: "Looker" },
  { url: "https://www.qlik.com", title: "Qlik" },
  { url: "https://bigquery.cloud.google.com", title: "Google BigQuery" },
  { url: "https://www.amplitude.com", title: "Amplitude" },
  { url: "https://www.mixpanel.com", title: "Mixpanel" },
  { url: "https://www.heap.io", title: "Heap" },

  // Miscellaneous Tech (new)
  { url: "https://www.levels.fyi", title: "Levels.fyi" },

    // Job Boards, Communities & Career Tech (new)
  { url: "https://www.teamblind.com", title: "Blind" },
  { url: "https://www.hired.com", title: "Hired" },
  { url: "https://www.triplebyte.com", title: "Triplebyte" },

  // Research, Academia & Standards
  { url: "https://research.google", title: "Google Research" },
  { url: "https://www.microsoft.com/research", title: "Microsoft Research" },
  { url: "https://www.ibm.com/research", title: "IBM Research" },
  { url: "https://www.mit.edu", title: "MIT (Tech Labs)" },
  { url: "https://www.stanford.edu", title: "Stanford Computer Science" },
  { url: "https://www.w3.org", title: "W3C (Web Standards)" },
  { url: "https://www.ieee.org", title: "IEEE" },
  { url: "https://www.acm.org", title: "ACM" },
  { url: "https://www.usenix.org", title: "USENIX" },

  // Hardware, Makers & Embedded Systems (new)
  { url: "https://www.adafruit.com", title: "Adafruit" },
  { url: "https://www.sparkfun.com", title: "SparkFun" },
  { url: "https://www.hackaday.com", title: "Hackaday" },
  { url: "https://www.instructables.com", title: "Instructables" },
  { url: "https://www.phoronix.com", title: "Phoronix" },
  { url: "https://www.servethehome.com", title: "ServeTheHome" },
  { url: "https://www.prusa3d.com", title: "Prusa3D" },
  { url: "https://www.thingiverse.com", title: "Thingiverse" },

  // VR/AR, Gaming Tech & Metaverse (new)
  { url: "https://www.spatial.io", title: "Spatial" },
  { url: "https://www.microsoft.com/mixed-reality", title: "Microsoft Mixed Reality" },
  { url: "https://www.apple.com/visionos", title: "Apple Vision Pro" },

  // Green Tech & Sustainability
  { url: "https://www.google.com/sustainability", title: "Google Sustainability" },
  { url: "https://www.microsoft.com/sustainability", title: "Microsoft Sustainability" },
  { url: "https://aws.amazon.com/sustainability", title: "AWS Sustainability" },
  { url: "https://www.ibm.com/sustainable", title: "IBM Sustainability" },

  // Niche Tools, APIs & Legacy Resources
  { url: "https://www.graphql.org", title: "GraphQL" },
  { url: "https://www.rapidapi.com", title: "RapidAPI" },
  { url: "https://www.programmableweb.com", title: "ProgrammableWeb" },
  { url: "https://www.twilio.com", title: "Twilio" },
  { url: "https://www.sendgrid.com", title: "SendGrid" },

  // Forums, Blogs & Personal Tech (new)
  { url: "https://www.lobste.rs", title: "Lobsters" },
  { url: "https://www.dzone.com", title: "DZone" },
  { url: "https://www.infoq.com", title: "InfoQ" },
  { url: "https://www.towardsdatascience.com", title: "Towards Data Science" },

    // e-Learning, Education & Academic Resources
  // MOOC Platforms & Online Learning (new)
  { url: "https://www.skillshare.com", title: "Skillshare" },
  { url: "https://www.masterclass.com", title: "MasterClass" },
  { url: "https://www.futurelearn.com", title: "FutureLearn" },
  { url: "https://www.duolingo.com", title: "Duolingo" },
  { url: "https://www.babbel.com", title: "Babbel" },

  // University & Institutional Websites (new)
  { url: "https://www.harvard.edu", title: "Harvard University" },
  { url: "https://www.ox.ac.uk", title: "University of Oxford" },
  { url: "https://www.cam.ac.uk", title: "University of Cambridge" },
  { url: "https://www.berkeley.edu", title: "UC Berkeley" },
  { url: "https://www.yale.edu", title: "Yale University" },
  { url: "https://www.princeton.edu", title: "Princeton University" },
  { url: "https://www.columbia.edu", title: "Columbia University" },
  { url: "https://www.ucla.edu", title: "UCLA" },

  // Academic Research Databases & Libraries (new)
  { url: "https://www.jstor.org", title: "JSTOR" },
  { url: "https://www.sciencedirect.com", title: "ScienceDirect" },
  { url: "https://www.nature.com", title: "Nature" },
  { url: "https://www.sciencemag.org", title: "Science Magazine" },
  { url: "https://ieeexplore.ieee.org", title: "IEEE Xplore" },
  { url: "https://www.scopus.com", title: "Scopus" },
  { url: "https://www.webofscience.com", title: "Web of Science" },
  { url: "https://www.aclanthology.org", title: "ACL Anthology" },

  // Learning Management Systems (LMS) & Tools (new)
  { url: "https://www.canvas.instructure.com", title: "Canvas LMS" },
  { url: "https://www.blackboard.com", title: "Blackboard" },
  { url: "https://www.moodle.org", title: "Moodle" },
  { url: "https://www.brightspace.com", title: "D2L Brightspace" },
  { url: "https://classroom.google.com", title: "Google Classroom" },
  { url: "https://www.microsoft.com/education", title: "Microsoft Teams for Education" },
  { url: "https://zoom.us/education", title: "Zoom Education" },

  // Educational Resource Hubs & Student Tools (new)
  { url: "https://www.quizlet.com", title: "Quizlet" },
  { url: "https://www.chegg.com", title: "Chegg" },
  { url: "https://www.britannica.com", title: "Britannica" },
  { url: "https://www.merriam-webster.com", title: "Merriam-Webster" },
  { url: "https://owl.purdue.edu", title: "Purdue OWL" },
  { url: "https://www.crashcourse.com", title: "Crash Course" },
  { url: "https://www.ted.com/education", title: "TED-Ed" },
  { url: "https://www.nationalgeographic.com/education", title: "National Geographic Education" },

    // Education – K-12, Language, Research, Test Prep, STEM, Libraries & More
  { url: "https://www.pbskids.org", title: "PBS Kids" },
  { url: "https://www.nationalgeographic.com/kids", title: "National Geographic Kids" },
  { url: "https://www.discoveryeducation.com", title: "Discovery Education" },
  { url: "https://www.brainpop.com", title: "BrainPOP" },
  { url: "https://www.abcya.com", title: "ABCya" },
  { url: "https://www.coolmathgames.com", title: "Cool Math Games" },
  { url: "https://www.starfall.com", title: "Starfall" },
  { url: "https://www.readingeggs.com", title: "Reading Eggs" },
  { url: "https://www.prodigygame.com", title: "Prodigy Game" },

  // Language Learning (additional)
  { url: "https://www.rosettastone.com", title: "Rosetta Stone" },
  { url: "https://www.memrise.com", title: "Memrise" },
  { url: "https://www.busuu.com", title: "Busuu" },
  { url: "https://www.italki.com", title: "italki" },
  { url: "https://www.preply.com", title: "Preply" },
  { url: "https://www.fluentu.com", title: "FluentU" },
  { url: "https://www.lingoda.com", title: "Lingoda" },
  { url: "https://www.britishcouncil.org/learnenglish", title: "British Council Learn English" },

  // Vocational, Professional & Certification
  { url: "https://www.cisco.com/learning", title: "Cisco Networking Academy" },
  { url: "https://www.google.com/certification", title: "Google Career Certificates" },
  { url: "https://www.comptia.org", title: "CompTIA" },
  { url: "https://www.kaplan.com", title: "Kaplan" },
  { url: "https://www.princetonreview.com", title: "The Princeton Review" },

  // Research Tools, Citation & Writing
  { url: "https://www.zotero.org", title: "Zotero" },
  { url: "https://www.mendeley.com", title: "Mendeley" },
  { url: "https://www.endnote.com", title: "EndNote" },
  { url: "https://www.grammarly.com", title: "Grammarly (academic)" },
  { url: "https://www.turnitin.com", title: "Turnitin" },
  { url: "https://www.easybib.com", title: "EasyBib" },
  { url: "https://www.citationmachine.net", title: "Citation Machine" },
  // Note: Sci-Hub and Library Genesis are controversial; added if you want to include
  { url: "https://www.sci-hub.se", title: "Sci-Hub (open access)" },
  { url: "https://libgen.is", title: "Library Genesis" },

  // Educational Forums & Communities
  { url: "https://www.edutopia.org", title: "Edutopia" },
  { url: "https://www.teachthought.com", title: "TeachThought" },
  { url: "https://www.edsurge.com", title: "EdSurge" },
  { url: "https://www.timeshighereducation.com", title: "Times Higher Education" },
  { url: "https://www.insidehighered.com", title: "Inside Higher Ed" },
  { url: "https://www.chronicle.com", title: "The Chronicle of Higher Education" },
  { url: "https://www.reddit.com/r/education", title: "Reddit Education" },
  { url: "https://www.reddit.com/r/teachers", title: "Reddit Teachers" },
  { url: "https://academia.stackexchange.com", title: "Academia Stack Exchange" },

  // Open Educational Resources (OER) & Digital Textbooks
  { url: "https://www.oercommons.org", title: "OER Commons" },
  { url: "https://www.merlot.org", title: "MERLOT" },
  { url: "https://www.openstax.org", title: "OpenStax" },
  { url: "https://ocw.mit.edu", title: "MIT OpenCourseWare" },
  { url: "https://www.projectgutenberg.org", title: "Project Gutenberg" },

  // Test Prep & Standardized Testing
  { url: "https://www.collegeboard.org", title: "College Board" },
  { url: "https://www.act.org", title: "ACT" },
  { url: "https://www.ets.org", title: "ETS (GRE/TOEFL)" },
  { url: "https://www.magoosh.com", title: "Magoosh" },
  { url: "https://www.varsitytutors.com", title: "Varsity Tutors" },
  { url: "https://www.wyzant.com", title: "Wyzant" },
  { url: "https://www.tutor.com", title: "Tutor.com" },

  // Special Education & Accessibility
  { url: "https://www.understood.org", title: "Understood (learning disabilities)" },
  { url: "https://www.ld.org", title: "Learning Disabilities Association" },
  { url: "https://www.autism-society.org", title: "Autism Society" },
  { url: "https://www.readingrockets.org", title: "Reading Rockets" },

  // Higher Education Administration & Admissions
  { url: "https://www.commonapp.org", title: "Common App" },
  { url: "https://www.coalitionforcollege.org", title: "Coalition for College" },
  { url: "https://www.naviance.com", title: "Naviance" },
  { url: "https://www.collegedata.com", title: "CollegeData" },
  { url: "https://www.niche.com", title: "Niche (college rankings)" },
  { url: "https://www.usnews.com", title: "U.S. News" },
  { url: "https://www.qs.com", title: "QS World Rankings" },
  { url: "https://www.shanghairanking.com", title: "Shanghai Ranking (ARWU)" },

  // STEM Education & Interactive Simulations
  { url: "https://phet.colorado.edu", title: "PhET Simulations" },
  { url: "https://www.desmos.com", title: "Desmos" },
  { url: "https://www.geogebra.org", title: "GeoGebra" },
  { url: "https://www.code.org", title: "Code.org" },
  { url: "https://scratch.mit.edu", title: "Scratch" },
  { url: "https://www.tinkercad.com", title: "Tinkercad" },
  { url: "https://www.nasa.gov/education", title: "NASA Education" },
  { url: "https://www.noaa.gov/education", title: "NOAA Education" },
  { url: "https://home.cern", title: "CERN" },

  // Educational Videos & Podcasts
  { url: "https://www.vsauce.com", title: "Vsauce" },
  { url: "https://www.minutephysics.com", title: "MinutePhysics" },
  { url: "https://www.3blue1brown.com", title: "3Blue1Brown" },
  { url: "https://www.numberphile.com", title: "Numberphile" },
  { url: "https://www.veritasium.com", title: "Veritasium" },
  { url: "https://www.scishow.com", title: "SciShow" },
  { url: "https://www.kurzgesagt.org", title: "Kurzgesagt" },
  { url: "https://www.pbs.org", title: "PBS" },

  // Libraries, Archives & Digital Preservation
  { url: "https://www.loc.gov", title: "Library of Congress" },
  { url: "https://www.bl.uk", title: "British Library" },
  { url: "https://gallica.bnf.fr", title: "Gallica (BnF)" },
  { url: "https://www.europeana.eu", title: "Europeana" },
  { url: "https://www.hathitrust.org", title: "HathiTrust" },
  { url: "https://www.projectmuse.org", title: "Project MUSE" },

  // Miscellaneous Classroom & School Tools
  { url: "https://www.quizizz.com", title: "Quizizz" },
  { url: "https://www.kahoot.com", title: "Kahoot!" },
  { url: "https://www.nearpod.com", title: "Nearpod" },
  { url: "https://www.edpuzzle.com", title: "Edpuzzle" },
  { url: "https://www.seesaw.me", title: "Seesaw" },
  { url: "https://www.classdojo.com", title: "ClassDojo" },
  { url: "https://www.remind.com", title: "Remind" },
  { url: "https://www.parentsquare.com", title: "ParentSquare" },
  { url: "https://www.schoology.com", title: "Schoology" },
  { url: "https://www.powerschool.com", title: "PowerSchool" },

    // Education – Early Childhood, Health, Environmental, Arts, History, Career, Global, EdTech
  { url: "https://www.naeyc.org", title: "NAEYC" },
  { url: "https://www.zerotothree.org", title: "Zero to Three" },

  // Health & Medical Education (new domain)
  { url: "https://www.medlineplus.gov", title: "MedlinePlus" },

  // Environmental & Sustainability Education (new domains)
  { url: "https://www.un.org", title: "United Nations" },
  { url: "https://www.edf.org", title: "Environmental Defense Fund" },

  // Arts, Music & Creative Education
  { url: "https://www.metmuseum.org", title: "The Metropolitan Museum of Art" },
  { url: "https://www.moma.org", title: "MoMA" },
  { url: "https://www.getty.edu", title: "Getty" },
  { url: "https://www.smarthistory.org", title: "Smarthistory" },
  { url: "https://www.musictheory.net", title: "MusicTheory.net" },
  { url: "https://www.musicted.com", title: "Music Education Tools" },

  // History & Social Studies
  { url: "https://www.history.com", title: "History" },
  { url: "https://www.smithsonianmag.com", title: "Smithsonian Magazine" },

  // Career & Workforce Development (new domains)
  { url: "https://www.careeronestop.org", title: "CareerOneStop" },
  { url: "https://www.bls.gov", title: "Bureau of Labor Statistics" },

  // Global & Multilingual Education
  { url: "https://www.alliance-francaise.org", title: "Alliance Française" },
  { url: "https://www.goethe.de", title: "Goethe-Institut" },
  { url: "https://www.unesco.org", title: "UNESCO" },

  // EdTech Companies (new)
  { url: "https://www.classcraft.com", title: "Classcraft" },
  { url: "https://www.edmodo.com", title: "Edmodo" },
  { url: "https://www.pebblego.com", title: "PebbleGo" },
  { url: "https://www.newsela.com", title: "Newsela" },
  { url: "https://www.raz-kids.com", title: "Raz-Kids" },
  { url: "https://www.dreambox.com", title: "DreamBox" },
  { url: "https://www.ixl.com", title: "IXL Learning" },
  { url: "https://www.outschool.com", title: "Outschool" },
  { url: "https://www.synthesis.com", title: "Synthesis" },

    // Education – Parent, Homeschool, Policy, Games, Publishing, Global, Reference & More
  { url: "https://www.commonsensemedia.org", title: "Common Sense Media" },
  { url: "https://www.parenting.com", title: "Parenting.com" },
  { url: "https://www.greatschools.org", title: "GreatSchools" },
  { url: "https://www.time4learning.com", title: "Time4Learning" },
  { url: "https://www.connectionsacademy.com", title: "Connections Academy" },
  { url: "https://www.k12.com", title: "K12" },
  { url: "https://www.brookings.edu", title: "Brookings Institution" },
  { url: "https://www.rand.org", title: "RAND Corporation" },
  { url: "https://www.heritage.org", title: "The Heritage Foundation" },
  { url: "https://www.aspeninstitute.org", title: "Aspen Institute" },
  { url: "https://www.oecd.org", title: "OECD" },
  { url: "https://www.minecraftedu.com", title: "Minecraft Education" },
  { url: "https://www.oxforduniversitypress.com", title: "Oxford University Press" },
  { url: "https://www.cambridge.org", title: "Cambridge University Press" },
  { url: "https://www.unicef.org", title: "UNICEF" },
  { url: "https://www.worldbank.org", title: "World Bank" },
  { url: "https://www.roomtoread.org", title: "Room to Read" },
  { url: "https://www.savethechildren.org", title: "Save the Children" },
  { url: "https://www.ted.com", title: "TED" },
  { url: "https://www.howstuffworks.com", title: "HowStuffWorks" },
  { url: "https://www.encyclopedia.com", title: "Encyclopedia.com" },
  { url: "https://www.infoplease.com", title: "InfoPlease" },
  { url: "https://www.factmonster.com", title: "Fact Monster" },
  { url: "https://www.scholastic.com", title: "Scholastic" },
  { url: "https://www.educationweek.org", title: "Education Week" },
  { url: "https://www.ed.gov", title: "U.S. Department of Education" },
  { url: "https://www.naacp.org", title: "NAACP" },
  { url: "https://www.aclu.org", title: "ACLU" },

    // UK Government & Public Sector
  // Central Government & Core Portals
  { url: "https://www.gov.uk", title: "GOV.UK" },
  { url: "https://www.parliament.uk", title: "UK Parliament" },
  { url: "https://commons.parliament.uk", title: "House of Commons" },
  { url: "https://lords.parliament.uk", title: "House of Lords" },
  { url: "https://www.cabinetoffice.gov.uk", title: "Cabinet Office" },
  { url: "https://www.number10.gov.uk", title: "10 Downing Street" },
  { url: "https://www.royal.uk", title: "The Royal Family" },
  { url: "https://www.thegazette.co.uk", title: "The Gazette" },
  { url: "https://www.legislation.gov.uk", title: "UK Legislation" },
  { url: "https://www.nationalarchives.gov.uk", title: "The National Archives" },

  // Major Departments & Ministries (subpages of GOV.UK)
  { url: "https://www.gov.uk/government/organisations/department-for-education", title: "Department for Education" },
  { url: "https://www.gov.uk/government/organisations/department-of-health-and-social-care", title: "Department of Health and Social Care" },
  { url: "https://www.gov.uk/government/organisations/home-office", title: "Home Office" },
  { url: "https://www.gov.uk/government/organisations/ministry-of-defence", title: "Ministry of Defence" },
  { url: "https://www.gov.uk/government/organisations/foreign-commonwealth-development-office", title: "FCDO" },
  { url: "https://www.gov.uk/government/organisations/hm-treasury", title: "HM Treasury" },
  { url: "https://www.gov.uk/government/organisations/hm-revenue-customs", title: "HMRC" },
  { url: "https://www.gov.uk/government/organisations/department-for-transport", title: "Department for Transport" },
  { url: "https://www.gov.uk/government/organisations/department-for-business-and-trade", title: "Department for Business and Trade" },
  { url: "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs", title: "DEFRA" },

  // Devolved Administrations & Regional Government
  { url: "https://www.gov.scot", title: "Scottish Government" },
  { url: "https://www.parliament.scot", title: "Scottish Parliament" },
  { url: "https://www.gov.wales", title: "Welsh Government" },
  { url: "https://senedd.wales", title: "Senedd (Welsh Parliament)" },
  { url: "https://www.niassembly.gov.uk", title: "Northern Ireland Assembly" },
  { url: "https://www.nidirect.gov.uk", title: "NI Direct" },
  { url: "https://www.gov.uk/government/organisations/northern-ireland-office", title: "Northern Ireland Office" },

  // Courts, Justice & Law Enforcement
  { url: "https://www.judiciary.uk", title: "Judiciary of England and Wales" },
  { url: "https://www.supremecourt.uk", title: "UK Supreme Court" },
  { url: "https://www.justice.gov.uk", title: "Ministry of Justice" },
  { url: "https://www.cps.gov.uk", title: "Crown Prosecution Service" },
  { url: "https://www.met.police.uk", title: "Metropolitan Police" },
  { url: "https://www.police.uk", title: "UK Police" },
  { url: "https://www.gov.uk/government/organisations/crown-prosecution-service", title: "Crown Prosecution Service" },

  // Health, Statistics & Public Services
  { url: "https://www.nhs.uk", title: "NHS" },
  { url: "https://www.ons.gov.uk", title: "Office for National Statistics" },
  { url: "https://www.gov.uk/government/organisations/uk-health-security-agency", title: "UK Health Security Agency (UKHSA)" },
  { url: "https://www.gov.uk/browse/education", title: "GOV.UK – Education" },

    // UK Government – Agencies, Councils, Education, Health & More
  // Executive Agencies & Regulators (new subpages)
  { url: "https://www.gov.uk/government/organisations/environment-agency", title: "Environment Agency" },
  { url: "https://www.gov.uk/government/organisations/ofcom", title: "Ofcom" },
  { url: "https://www.gov.uk/government/organisations/ofgem", title: "Ofgem" },
  { url: "https://www.gov.uk/government/organisations/ofqual", title: "Ofqual" },
  { url: "https://www.gov.uk/government/organisations/companies-house", title: "Companies House" },
  { url: "https://www.gov.uk/government/organisations/land-registry", title: "HM Land Registry" },
  { url: "https://www.gov.uk/government/organisations/driver-and-vehicle-licensing-agency", title: "DVLA" },
  { url: "https://www.gov.uk/government/organisations/passport-office", title: "HM Passport Office" },
  { url: "https://www.gov.uk/government/organisations/uk-visas-and-immigration", title: "UK Visas and Immigration" },
  { url: "https://www.gov.uk/government/organisations/border-force", title: "Border Force" },
  { url: "https://www.gov.uk/find-local-council", title: "Find Your Local Council" },

  // Local Government & Councils
  { url: "https://www.london.gov.uk", title: "Greater London Authority" },
  { url: "https://www.manchester.gov.uk", title: "Manchester City Council" },
  { url: "https://www.birmingham.gov.uk", title: "Birmingham City Council" },
  { url: "https://www.edinburgh.gov.uk", title: "City of Edinburgh Council" },
  { url: "https://www.cardiff.gov.uk", title: "Cardiff Council" },
  { url: "https://www.belfastcity.gov.uk", title: "Belfast City Council" },

  // Education & Skills
  { url: "https://www.education.gov.uk", title: "Department for Education (education.gov.uk)" },
  { url: "https://www.ofsted.gov.uk", title: "Ofsted" },
  { url: "https://www.ofs.org.uk", title: "Office for Students" },
  { url: "https://www.gov.uk/apply-for-teacher-training", title: "Apply for Teacher Training" },
  { url: "https://www.ucas.com", title: "UCAS" },
  { url: "https://www.skillsforcare.org.uk", title: "Skills for Care" },

  // Health & Social Care
  { url: "https://www.england.nhs.uk", title: "NHS England" },
  { url: "https://www.nice.org.uk", title: "NICE (National Institute for Health and Care Excellence)" },
  { url: "https://www.socialcare.wales", title: "Social Care Wales" },
  { url: "https://www.hscni.net", title: "Health and Social Care Northern Ireland" },

  // Finance, Economy & Trade (new subpage)
  { url: "https://export.great.gov.uk", title: "Great.gov.uk Export" },

    // UK Government – Justice, Transport, Culture, Science, Security & More
  // Justice & Legal (new)
  { url: "https://www.gov.uk/government/organisations/criminal-cases-review-commission", title: "Criminal Cases Review Commission" },
  { url: "https://www.sentencingcouncil.org.uk", title: "Sentencing Council" },
  { url: "https://www.bailii.org", title: "BAILII (British and Irish Legal Information Institute)" },
  { url: "https://www.gov.uk/browse/justice", title: "GOV.UK – Justice" },

  // Transport, Infrastructure & Environment (new)
  { url: "https://www.highwaysengland.co.uk", title: "National Highways" },
  { url: "https://www.networkrail.co.uk", title: "Network Rail" },
  { url: "https://www.caa.co.uk", title: "Civil Aviation Authority" },
  { url: "https://www.naturalengland.org.uk", title: "Natural England" },
  { url: "https://www.nature.scot", title: "NatureScot" },
  { url: "https://www.cyfoethnaturiolcymru.gov.uk", title: "Natural Resources Wales" },
  { url: "https://www.daera-ni.gov.uk", title: "DAERA (Northern Ireland)" },

  // Culture, Media & Heritage (new)
  { url: "https://www.gov.uk/government/organisations/department-for-culture-media-and-sport", title: "DCMS (Department for Culture, Media & Sport)" },
  { url: "https://www.britishcouncil.org", title: "British Council" },
  { url: "https://www.english-heritage.org.uk", title: "English Heritage" },
  { url: "https://www.historicenvironment.scot", title: "Historic Environment Scotland" },
  { url: "https://www.museum.wales", title: "Amgueddfa Cymru (Museum Wales)" },
  { url: "https://www.nmni.com", title: "National Museums Northern Ireland" },

  // Science, Research & Innovation (new)
  { url: "https://www.ukri.org", title: "UK Research and Innovation" },
  { url: "https://www.nerc.ac.uk", title: "NERC (Natural Environment Research Council)" },
  { url: "https://www.gov.uk/government/organisations/government-office-for-science", title: "Government Office for Science" },
  { url: "https://www.royalsociety.org", title: "The Royal Society" },

  // International, Defence & Security (new)
  { url: "https://www.gov.uk/government/organisations/uk-export-finance", title: "UK Export Finance" },
  { url: "https://www.gov.uk/government/organisations/national-crime-agency", title: "National Crime Agency" },
  { url: "https://www.mi5.gov.uk", title: "MI5 (Security Service)" },
  { url: "https://www.sis.gov.uk", title: "MI6 (Secret Intelligence Service)" },

    // UK Government – Local, Records, Housing, Business, Emergency & More (new)
  { url: "https://www.glasgow.gov.uk", title: "Glasgow City Council" },
  { url: "https://www.nrscotland.gov.uk", title: "National Records of Scotland" },
  { url: "https://www.nisra.gov.uk", title: "NISRA (Northern Ireland Statistics and Research Agency)" },
  { url: "https://www.statswales.gov.wales", title: "StatsWales" },
  { url: "https://www.gov.uk/government/organisations/ministry-of-housing-communities-and-local-government", title: "MHCLG (Housing, Communities & Local Government)" },
  { url: "https://www.planningportal.co.uk", title: "Planning Portal" },
  { url: "https://www.homesengland.gov.uk", title: "Homes England" },
  { url: "https://www.scottishhousingregulator.gov.scot", title: "Scottish Housing Regulator" },
  { url: "https://www.companieshouse.gov.uk", title: "Companies House (companieshouse.gov.uk)" },
  { url: "https://www.gov.uk/government/organisations/competition-and-markets-authority", title: "Competition and Markets Authority (CMA)" },
  { url: "https://www.tradingstandards.uk", title: "Trading Standards" },
  { url: "https://www.citizensadvice.org.uk", title: "Citizens Advice" },
  { url: "https://www.fireandrescue.uk", title: "Fire and Rescue Services" },
  { url: "https://www.rnli.org.uk", title: "RNLI (Royal National Lifeboat Institution)" },
  { url: "https://www.britishredcross.org.uk", title: "British Red Cross" },
  { url: "https://www.gov.uk/prepare", title: "GOV.UK – Emergency Preparedness" },

    // UK Government – Remaining Public Bodies, Culture, International, & Miscellaneous
  { url: "https://www.gov.uk/government/organisations/arts-council-england", title: "Arts Council England" },
  { url: "https://www.sportengland.org", title: "Sport England" },
  { url: "https://www.bfi.org.uk", title: "British Film Institute (BFI)" },
  { url: "https://www.equalityhumanrights.com", title: "Equality and Human Rights Commission" },
  { url: "https://www.ico.org.uk", title: "Information Commissioner's Office (ICO)" },
  { url: "https://www.gov.uk/government/organisations/charity-commission", title: "Charity Commission" },
  { url: "https://www.acas.org.uk", title: "ACAS (Advisory, Conciliation and Arbitration Service)" },
  { url: "https://www.gov.uk/government/organisations/health-and-safety-executive", title: "Health and Safety Executive (HSE)" },
  { url: "https://www.food.gov.uk", title: "Food Standards Agency" },
  { url: "https://www.gov.uk/government/organisations/veterinary-medicines-directorate", title: "Veterinary Medicines Directorate" },

  // Devolved & Regional Expansions
  { url: "https://www.visitscotland.com", title: "VisitScotland (official tourism)" },
  { url: "https://www.visitwales.com", title: "Visit Wales (official tourism)" },
  { url: "https://www.discovernorthernireland.com", title: "Discover Northern Ireland (official tourism)" },

  // International & Diplomatic
  { url: "https://www.gov.uk/world", title: "UK Diplomatic Network" },
  { url: "https://www.fcdo.gov.uk", title: "Foreign, Commonwealth & Development Office (FCDO)" },
  { url: "https://www.ukti.gov.uk", title: "UK Trade & Investment (legacy)" },

  // Museums & Cultural Official
  { url: "https://www.tate.org.uk", title: "Tate" },
  { url: "https://www.britishmuseum.org", title: "The British Museum" },
  { url: "https://www.vam.ac.uk", title: "V&A Museum" },

  // Miscellaneous Official & Public Information
  { url: "https://www.moneyadviceservice.org.uk", title: "Money Advice Service" },
  { url: "https://www.turn2us.org.uk", title: "Turn2us" },
  { url: "https://www.gov.uk/browse/benefits", title: "GOV.UK – Benefits" },
  { url: "https://www.gov.uk/browse/transport", title: "GOV.UK – Transport" },
  { url: "https://www.gov.uk/browse/business", title: "GOV.UK – Business" },
  { url: "https://www.gov.uk/coronavirus", title: "GOV.UK – Coronavirus (historical)" },

    // Denmark – Government & Public Sector
  { url: "https://www.retsinformation.dk", title: "Retsinformation (official legislation)" },
  { url: "https://www.regeringen.dk", title: "The Government (Regeringen)" },
  { url: "https://www.stm.dk", title: "Prime Minister's Office (Statsministeriet)" },
  { url: "https://www.ft.dk", title: "Folketinget (Danish Parliament)" },
  { url: "https://www.borger.dk", title: "Borger.dk (citizen portal)" },
  { url: "https://www.virk.dk", title: "Virk.dk (business portal)" },
  { url: "https://www.um.dk", title: "Ministry of Foreign Affairs (Udenrigsministeriet)" },
  { url: "https://www.fm.dk", title: "Ministry of Finance (Finansministeriet)" },
  { url: "https://www.ufm.dk", title: "Ministry of Higher Education and Science" },
  { url: "https://www.uim.dk", title: "Ministry of Immigration and Integration" },

  // Key Ministries & Agencies
  { url: "https://www.sum.dk", title: "Ministry of Health (Sundhedsministeriet)" },
  { url: "https://www.sst.dk", title: "Danish Health Authority (Sundhedsstyrelsen)" },
  { url: "https://www.politi.dk", title: "Danish Police" },
  { url: "https://www.skat.dk", title: "Danish Tax Authority (SKAT)" },
  { url: "https://www.ujust.dk", title: "Ministry of Justice (Justitsministeriet)" },
  { url: "https://www.domstol.dk", title: "Danish Courts" },
  { url: "https://www.kriminalforsorgen.dk", title: "Danish Prison and Probation Service" },
  { url: "https://www.bm.dk", title: "Ministry of Employment (Beskæftigelsesministeriet)" },
  { url: "https://www.evm.dk", title: "Ministry of Industry, Business and Financial Affairs (Erhvervsministeriet)" },

  // Local Government & Regions
  { url: "https://www.kl.dk", title: "Local Government Denmark (KL)" },
  { url: "https://www.kk.dk", title: "Copenhagen Municipality (Københavns Kommune)" },
  { url: "https://www.aarhus.dk", title: "Aarhus Municipality" },
  { url: "https://www.odense.dk", title: "Odense Municipality" },
  { url: "https://www.aalborg.dk", title: "Aalborg Municipality" },
  { url: "https://www.regionh.dk", title: "Capital Region of Denmark" },
  { url: "https://www.regionmidtjylland.dk", title: "Central Denmark Region" },

  // Education, Culture & Research
  { url: "https://www.styrelsen.dk", title: "Danish Agency for Higher Education and Science" },
  { url: "https://www.kum.dk", title: "Ministry of Culture (Kulturministeriet)" },
  { url: "https://www.dst.dk", title: "Statistics Denmark (Danmarks Statistik)" },
  { url: "https://www.kb.dk", title: "Royal Danish Library (Det Kongelige Bibliotek)" },
  { url: "https://www.ku.dk", title: "University of Copenhagen (Københavns Universitet)" },
  { url: "https://www.au.dk", title: "Aarhus University" },

  // Health, Social & Emergency
  { url: "https://www.sundhed.dk", title: "Sundhed.dk (health portal)" },
  { url: "https://www.regioner.dk", title: "Danish Regions" },
  { url: "https://www.brs.dk", title: "Danish Emergency Management Agency (Beredskabsstyrelsen)" },

    // Denmark – Business, Environment, Transport, Culture, Digitalisation (new)
  { url: "https://www.erhvervsstyrelsen.dk", title: "Danish Business Authority" },
  { url: "https://www.nationalbanken.dk", title: "Danmarks Nationalbank" },
  { url: "https://www.investindk.com", title: "Invest in Denmark" },
  { url: "https://www.kfst.dk", title: "Danish Competition and Consumer Authority" },
  { url: "https://www.digi.dk", title: "Danish Agency for Digital Government" },
  { url: "https://www.datafordeler.dk", title: "Datafordeler (Data Distributor)" },
  { url: "https://www.innovationsfonden.dk", title: "Innovation Fund Denmark" },
  { url: "https://www.slks.dk", title: "Danish Agency for Culture and Palaces" },
  { url: "https://www.dfi.dk", title: "Danish Film Institute" },
  { url: "https://www.tv2.dk", title: "TV2 (Public Service Broadcaster)" },

    // Denmark – Justice, Defence, Social, Health, Tourism & International (new)
  { url: "https://www.anklagemyndigheden.dk", title: "Danish Prosecution Service" },
  { url: "https://www.forsvar.dk", title: "Danish Defence" },
  { url: "https://www.hjemmevaernet.dk", title: "Danish Home Guard" },

  { url: "https://www.pensionsinfo.dk", title: "Pensions Info (PensionsInfo)" },
  { url: "https://www.atp.dk", title: "ATP (Labour Market Supplementary Pension)" },
  { url: "https://www.socialstyrelsen.dk", title: "National Board of Social Services (Socialstyrelsen)" },

  { url: "https://www.forskningsradet.dk", title: "Danish Research Councils (Forskningsrådet)" },

  { url: "https://www.laegemiddelstyrelsen.dk", title: "Danish Medicines Agency" },
  { url: "https://www.patientombuddet.dk", title: "Danish Patient Complaints Board" },

  { url: "https://www.visitdenmark.com", title: "VisitDenmark (official tourism)" },
  { url: "https://www.denmark.dk", title: "Denmark.dk (Official Denmark portal)" },
  { url: "https://www.danida.dk", title: "Danida (Danish International Development Agency)" },

    // Denmark – Additional Municipalities, Agencies, and Sports (new)
  { url: "https://www.esbjerg.dk", title: "Esbjerg Municipality" },
  { url: "https://www.randers.dk", title: "Randers Municipality" },
  { url: "https://www.vejle.dk", title: "Vejle Municipality" },
  { url: "https://www.roskilde.dk", title: "Roskilde Municipality" },
  { url: "https://www.frederiksberg.dk", title: "Frederiksberg Municipality" },
  { url: "https://www.gentofte.dk", title: "Gentofte Municipality" },

  { url: "https://www.forbrugerombudsmanden.dk", title: "Consumer Ombudsman (Forbrugerombudsmanden)" },
  { url: "https://www.datatilsynet.dk", title: "Danish Data Protection Agency (Datatilsynet)" },
  { url: "https://www.handicap.dk", title: "Danish Disability Council (Det Centrale Handicapråd)" },

  { url: "https://www.teamdanmark.dk", title: "Team Denmark (elite sports)" },
  { url: "https://www.dif.dk", title: "Danish Sports Confederation (Danmarks Idrætsforbund)" },
  { url: "https://www.dbu.dk", title: "Danish Football Association (DBU)" },
  { url: "https://www.dhf.dk", title: "Danish Handball Federation (DHF)" },

  { url: "https://www.danskeuniversiteter.dk", title: "Danish Universities (Danske Universiteter)" },

    // Estonia – Government & Public Sector
  { url: "https://www.valitsus.ee", title: "Estonian Government (Valitsus)" },
  { url: "https://www.riigikogu.ee", title: "Riigikogu (Estonian Parliament)" },
  { url: "https://www.president.ee", title: "Office of the President of Estonia" },
  { url: "https://www.eesti.ee", title: "Eesti.ee (citizen and business portal)" },
  { url: "https://www.riigiteataja.ee", title: "Riigi Teataja (official legislation gazette)" },

  { url: "https://www.vm.ee", title: "Ministry of Foreign Affairs (Välisministeerium)" },
  { url: "https://www.siseministeerium.ee", title: "Ministry of the Interior (Siseministeerium)" },
  { url: "https://www.kaitseministeerium.ee", title: "Ministry of Defence (Kaitseministeerium)" },
  { url: "https://www.rahandusministeerium.ee", title: "Ministry of Finance (Rahandusministeerium)" },
  { url: "https://www.hm.ee", title: "Ministry of Education and Research (Haridus- ja Teadusministeerium)" },
  { url: "https://www.sotsiaalministeerium.ee", title: "Ministry of Social Affairs (Sotsiaalministeerium)" },
  { url: "https://www.majandus-ja-kommunikatsiooniministeerium.ee", title: "Ministry of Economic Affairs and Communications" },
  { url: "https://www.keskkonnaministeerium.ee", title: "Ministry of the Environment (Keskkonnaministeerium)" },
  { url: "https://www.justiitsministeerium.ee", title: "Ministry of Justice (Justiitsministeerium)" },

  { url: "https://www.politsei.ee", title: "Estonian Police and Border Guard Board" },
  { url: "https://www.emta.ee", title: "Estonian Tax and Customs Board (Maksu- ja Tolliamet)" },
  { url: "https://www.terviseamet.ee", title: "Health Board (Terviseamet)" },
  { url: "https://www.haigekassa.ee", title: "Estonian Health Insurance Fund (Haigekassa)" },
  { url: "https://www.tootukassa.ee", title: "Estonian Unemployment Insurance Fund (Töötukassa)" },
  { url: "https://www.riigikontroll.ee", title: "National Audit Office (Riigikontroll)" },
  { url: "https://www.konkurentsiamet.ee", title: "Estonian Competition Authority (Konkurentsiamet)" },
  { url: "https://www.tarbijakaitseamet.ee", title: "Consumer Protection Board (Tarbijakaitseamet)" },
  { url: "https://www.datainspektsioon.ee", title: "Data Protection Inspectorate (Andmekaitse Inspektsioon)" },
  { url: "https://www.ark.ee", title: "Estonian Land Board (Maa-amet)" },
  { url: "https://www.stat.ee", title: "Statistics Estonia (Statistikaamet)" },

  { url: "https://www.x-tee.ee", title: "X-Road (data exchange backbone)" },
  { url: "https://www.ria.ee", title: "Estonian Information System Authority (RIA)" },
  { url: "https://www.e-tervis.ee", title: "e-Health initiatives (E-tervis)" },

  { url: "https://www.tallinn.ee", title: "Tallinn City Government" },
  { url: "https://www.tartu.ee", title: "Tartu City Government" },
  { url: "https://www.narva.ee", title: "Narva City Government" },
  { url: "https://www.parnu.ee", title: "Pärnu City Government" },

    // Estonia – Justice, Defence, Education, Economy, Environment, Registries & More
  { url: "https://www.kohus.ee", title: "Estonian Courts Portal" },
  { url: "https://www.riigikohus.ee", title: "Supreme Court of Estonia" },
  { url: "https://www.prokuratuur.ee", title: "Prosecutor's Office" },
  { url: "https://www.vla.ee", title: "Estonian Prison and Probation Service (Vanglateenistus)" },

  { url: "https://www.mil.ee", title: "Estonian Defence Forces" },
  { url: "https://www.kaitseliit.ee", title: "Estonian Defence League" },

  { url: "https://www.harno.ee", title: "Estonian Education and Youth Board (Harno)" },
  { url: "https://www.etag.ee", title: "Estonian Research Council (ETAG)" },
  { url: "https://www.kultuuriministeerium.ee", title: "Ministry of Culture (Kultuuriministeerium)" },
  { url: "https://www.rahvusooper.ee", title: "Estonian National Opera" },
  { url: "https://www.nlib.ee", title: "National Library of Estonia" },

  { url: "https://www.eestipank.ee", title: "Bank of Estonia (Eesti Pank)" },
  { url: "https://www.finantsinspektsioon.ee", title: "Estonian Financial Supervision Authority" },

  { url: "https://www.keskkonnaamet.ee", title: "Environmental Board (Keskkonnaamet)" },
  { url: "https://www.transpordiamet.ee", title: "Estonian Transport Administration (Transpordiamet)" },
  { url: "https://www.maanteeamet.ee", title: "Estonian Road Administration (Maanteeamet, historical)" },

  { url: "https://www.riha.ee", title: "State Information System (RIHA)" },
  { url: "https://www.ariregister.rik.ee", title: "Business Register (Äriregister)" },
  { url: "https://www.rahvastikuregister.ee", title: "Population Register (Rahvastikuregister)" },

    // Estonia – Additional Municipalities, Film, Digital & Agriculture (new)
  { url: "https://www.kohtla-jarve.ee", title: "Kohtla-Järve City Government" },
  { url: "https://www.rakvere.ee", title: "Rakvere City Government" },
  { url: "https://www.viljandi.ee", title: "Viljandi City Government" },
  { url: "https://www.haapsalu.ee", title: "Haapsalu City Government" },
  { url: "https://www.johvi.ee", title: "Jõhvi Municipality" },
  { url: "https://www.maardu.ee", title: "Maardu City Government" },
  { url: "https://www.sillamae.ee", title: "Sillamäe City Government" },
  { url: "https://www.keila.ee", title: "Keila City Government" },
  { url: "https://www.saue.ee", title: "Saue Municipality" },
  { url: "https://www.viimsi.ee", title: "Viimsi Municipality" },

  { url: "https://www.digi.ee", title: "Digital Initiatives (Digi.ee)" },
  { url: "https://www.film.ee", title: "Estonian Film Institute" },
  { url: "https://www.paasteamet.ee", title: "Estonian Rescue Board (Päästeamet)" },
  
    // Estonia – Security, Universities, Heritage & Public Broadcasting (new)
  { url: "https://www.kaitsepolitsei.ee", title: "Estonian Internal Security Service (KAPO)" },
  { url: "https://www.ut.ee", title: "University of Tartu" },
  { url: "https://www.ttu.ee", title: "Tallinn University of Technology (TalTech)" },
  { url: "https://www.tlu.ee", title: "Tallinn University" },
  { url: "https://www.muinas.ee", title: "National Heritage Board (Muinsuskaitseamet)" },
  { url: "https://www.err.ee", title: "Estonian Public Broadcasting (ERR)" },

    // Singapore – Government & Public Sector
  { url: "https://www.gov.sg", title: "Main Government Portal" },
  { url: "https://www.pmo.gov.sg", title: "Prime Minister's Office" },
  { url: "https://www.parliament.gov.sg", title: "Parliament of Singapore" },
  { url: "https://www.istana.gov.sg", title: "The Istana (President's Office)" },

  { url: "https://www.mof.gov.sg", title: "Ministry of Finance (MOF)" },
  { url: "https://www.mom.gov.sg", title: "Ministry of Manpower (MOM)" },
  { url: "https://www.moe.gov.sg", title: "Ministry of Education (MOE)" },
  { url: "https://www.moh.gov.sg", title: "Ministry of Health (MOH)" },
  { url: "https://www.mot.gov.sg", title: "Ministry of Transport (MOT)" },
  { url: "https://www.mnd.gov.sg", title: "Ministry of National Development (MND)" },
  { url: "https://www.mti.gov.sg", title: "Ministry of Trade and Industry (MTI)" },
  { url: "https://www.mha.gov.sg", title: "Ministry of Home Affairs (MHA)" },
  { url: "https://www.mfa.gov.sg", title: "Ministry of Foreign Affairs (MFA)" },
  { url: "https://www.msf.gov.sg", title: "Ministry of Social and Family Development (MSF)" },
  { url: "https://www.mccy.gov.sg", title: "Ministry of Culture, Community and Youth (MCCY)" },

  { url: "https://www.ica.gov.sg", title: "Immigration & Checkpoints Authority (ICA)" },
  { url: "https://www.spf.gov.sg", title: "Singapore Police Force (SPF)" },
  { url: "https://www.mindef.gov.sg", title: "Ministry of Defence (MINDEF)" },
  { url: "https://www.nea.gov.sg", title: "National Environment Agency (NEA)" },
  { url: "https://www.pub.gov.sg", title: "PUB (Water)" },
  { url: "https://www.hdb.gov.sg", title: "Housing and Development Board (HDB)" },
  { url: "https://www.lta.gov.sg", title: "Land Transport Authority (LTA)" },
  { url: "https://www.caas.gov.sg", title: "Civil Aviation Authority of Singapore (CAAS)" },
  { url: "https://www.mpa.gov.sg", title: "Maritime and Port Authority (MPA)" },
  { url: "https://www.jtc.gov.sg", title: "JTC Corporation" },
  { url: "https://www.a-star.edu.sg", title: "A*STAR (Agency for Science, Technology and Research)" },
  { url: "https://www.enterprisesg.gov.sg", title: "Enterprise Singapore" },

  { url: "https://www.nie.edu.sg", title: "National Institute of Education (NIE)" },
  { url: "https://www.nus.edu.sg", title: "National University of Singapore (NUS)" },
  { url: "https://www.ntu.edu.sg", title: "Nanyang Technological University (NTU)" },
  { url: "https://www.smu.edu.sg", title: "Singapore Management University (SMU)" },
  { url: "https://www.sit.edu.sg", title: "Singapore Institute of Technology (SIT)" },
  { url: "https://www.sutd.edu.sg", title: "Singapore University of Technology and Design (SUTD)" },

  { url: "https://www.nhg.com.sg", title: "National Healthcare Group (NHG)" },
  { url: "https://www.singhealth.com.sg", title: "SingHealth" },
  { url: "https://www.healthhub.sg", title: "HealthHub" },

    // Singapore – Additional Statutory Boards, Hospitals, Polytechnics & Agencies
  { url: "https://www.ssg.gov.sg", title: "SkillsFuture Singapore (SSG)" },
  { url: "https://www.wsg.gov.sg", title: "Workforce Singapore (WSG)" },
  { url: "https://www.scdf.gov.sg", title: "Singapore Civil Defence Force (SCDF)" },
  { url: "https://www.ura.gov.sg", title: "Urban Redevelopment Authority (URA)" },
  { url: "https://www.imda.gov.sg", title: "Infocomm Media Development Authority (IMDA)" },
  { url: "https://www.mci.gov.sg", title: "Ministry of Communications and Information (MCI)" },

  { url: "https://www.nuhs.edu.sg", title: "National University Health System (NUHS)" },
  { url: "https://www.kkh.com.sg", title: "KK Women’s and Children’s Hospital" },
  { url: "https://www.sgh.com.sg", title: "Singapore General Hospital (SGH)" },
  { url: "https://www.ttsh.com.sg", title: "Tan Tock Seng Hospital (TTSH)" },
  { url: "https://www.ncid.sg", title: "National Centre for Infectious Diseases (NCID)" },

  { url: "https://www.nhb.gov.sg", title: "National Heritage Board (NHB)" },
  { url: "https://www.nac.gov.sg", title: "National Arts Council (NAC)" },
  { url: "https://www.sportsg.gov.sg", title: "Sport Singapore (SportSG)" },

  { url: "https://www.sp.edu.sg", title: "Singapore Polytechnic (SP)" },
  { url: "https://www.np.edu.sg", title: "Ngee Ann Polytechnic (NP)" },
  { url: "https://www.rp.edu.sg", title: "Republic Polytechnic (RP)" },
  { url: "https://www.tp.edu.sg", title: "Temasek Polytechnic (TP)" },
  { url: "https://www.nyp.edu.sg", title: "Nanyang Polytechnic (NYP)" },

    // Australia – Government & Public Sector
  // Federal Core Portals
  { url: "https://www.australia.gov.au", title: "Official Australian Government Portal" },
  { url: "https://www.pm.gov.au", title: "Prime Minister of Australia" },
  { url: "https://www.aph.gov.au", title: "Parliament of Australia" },
  { url: "https://www.gg.gov.au", title: "Governor-General of Australia" },

  // Major Federal Departments & Agencies
  { url: "https://www.treasury.gov.au", title: "Treasury" },
  { url: "https://www.dfat.gov.au", title: "Department of Foreign Affairs and Trade" },
  { url: "https://www.defence.gov.au", title: "Department of Defence" },
  { url: "https://www.homeaffairs.gov.au", title: "Department of Home Affairs" },
  { url: "https://www.education.gov.au", title: "Department of Education" },
  { url: "https://www.health.gov.au", title: "Department of Health and Aged Care" },
  { url: "https://www.industry.gov.au", title: "Department of Industry, Science and Resources" },
  { url: "https://www.agriculture.gov.au", title: "Department of Agriculture, Fisheries and Forestry" },
  { url: "https://www.environment.gov.au", title: "Department of Climate Change, Energy, the Environment and Water" },
  { url: "https://www.communications.gov.au", title: "Department of Communications and the Arts (or relevant)" },
  { url: "https://www.ato.gov.au", title: "Australian Taxation Office (ATO)" },
  { url: "https://www.abs.gov.au", title: "Australian Bureau of Statistics (ABS)" },
  { url: "https://www.apra.gov.au", title: "Australian Prudential Regulation Authority (APRA)" },
  { url: "https://www.asic.gov.au", title: "Australian Securities and Investments Commission (ASIC)" },
  { url: "https://www.accc.gov.au", title: "Australian Competition and Consumer Commission (ACCC)" },
  { url: "https://www.ndis.gov.au", title: "National Disability Insurance Scheme (NDIS)" },

  // Courts & Justice
  { url: "https://www.hcourt.gov.au", title: "High Court of Australia" },
  { url: "https://www.fedcourt.gov.au", title: "Federal Court of Australia" },
  { url: "https://www.familycourt.gov.au", title: "Federal Circuit and Family Court of Australia" },

  // State & Territory Governments
  { url: "https://www.nsw.gov.au", title: "NSW Government" },
  { url: "https://www.service.nsw.gov.au", title: "Service NSW" },
  { url: "https://www.vic.gov.au", title: "Victoria Government" },
  { url: "https://www.service.vic.gov.au", title: "Service Victoria" },
  { url: "https://www.qld.gov.au", title: "Queensland Government" },
  { url: "https://www.wa.gov.au", title: "Western Australia Government" },
  { url: "https://www.sa.gov.au", title: "South Australia Government" },
  { url: "https://www.tas.gov.au", title: "Tasmanian Government" },
  { url: "https://www.act.gov.au", title: "ACT Government" },
  { url: "https://www.nt.gov.au", title: "Northern Territory Government" },

    // Australia – Additional Federal Agencies, Services & State Portals (new)
  { url: "https://www.servicesaustralia.gov.au", title: "Services Australia (Centrelink, Medicare)" },
  { url: "https://www.rba.gov.au", title: "Reserve Bank of Australia" },
  { url: "https://www.aec.gov.au", title: "Australian Electoral Commission" },
  { url: "https://www.csiro.au", title: "CSIRO (Science & Research)" },
  { url: "https://www.bom.gov.au", title: "Bureau of Meteorology" },
  { url: "https://www.ga.gov.au", title: "Geoscience Australia" },
  { url: "https://www.tga.gov.au", title: "Therapeutic Goods Administration" },
  { url: "https://www.foodstandards.gov.au", title: "Food Standards Australia New Zealand" },
  { url: "https://www.safeworkaustralia.gov.au", title: "Safe Work Australia" },
  { url: "https://www.fairwork.gov.au", title: "Fair Work Ombudsman" },
  { url: "https://www.myagedcare.gov.au", title: "My Aged Care" },
  { url: "https://www.service.wa.gov.au", title: "Service WA (Western Australia)" },
  { url: "https://www.services.qld.gov.au", title: "Services Queensland" },

    // New Zealand – Government & Public Sector
  { url: "https://www.govt.nz", title: "Main Government Portal (Te Kāwanatanga o Aotearoa)" },
  { url: "https://www.parliament.nz", title: "New Zealand Parliament" },
  { url: "https://www.pmc.govt.nz", title: "Prime Minister and Cabinet" },
  { url: "https://www.treasury.govt.nz", title: "The Treasury" },
  { url: "https://www.health.govt.nz", title: "Ministry of Health" },
  { url: "https://www.education.govt.nz", title: "Ministry of Education" },
  { url: "https://www.mbie.govt.nz", title: "Ministry of Business, Innovation and Employment" },
  { url: "https://www.mfat.govt.nz", title: "Ministry of Foreign Affairs and Trade" },
  { url: "https://www.justice.govt.nz", title: "Ministry of Justice / Courts of New Zealand" },
  { url: "https://www.stats.govt.nz", title: "Statistics New Zealand (Stats NZ)" },
  { url: "https://www.ird.govt.nz", title: "Inland Revenue Department (IRD)" },
  { url: "https://www.nzdf.mil.nz", title: "New Zealand Defence Force" },
  { url: "https://www.police.govt.nz", title: "New Zealand Police" },
  { url: "https://www.dia.govt.nz", title: "Department of Internal Affairs (DIA)" },

    // South Korea – Government & Public Sector
  { url: "https://www.korea.kr", title: "Official Korea Portal" },
  { url: "https://www.president.go.kr", title: "Office of the President" },
  { url: "https://www.assembly.go.kr", title: "National Assembly" },
  { url: "https://www.pmo.go.kr", title: "Prime Minister's Office" },

  { url: "https://www.moef.go.kr", title: "Ministry of Economy and Finance" },
  { url: "https://www.mnd.go.kr", title: "Ministry of National Defense" },
  { url: "https://www.mofa.go.kr", title: "Ministry of Foreign Affairs" },
  { url: "https://www.mois.go.kr", title: "Ministry of the Interior and Safety" },
  { url: "https://www.moe.go.kr", title: "Ministry of Education" },
  { url: "https://www.mohw.go.kr", title: "Ministry of Health and Welfare" },
  { url: "https://www.motie.go.kr", title: "Ministry of Trade, Industry and Energy" },
  { url: "https://www.mlit.go.kr", title: "Ministry of Land, Infrastructure and Transport" },
  { url: "https://www.me.go.kr", title: "Ministry of Environment" },
  { url: "https://www.mcst.go.kr", title: "Ministry of Culture, Sports and Tourism" },

  { url: "https://www.nts.go.kr", title: "National Tax Service" },
  { url: "https://www.customs.go.kr", title: "Korea Customs Service" },
  { url: "https://www.police.go.kr", title: "Korean National Police Agency" },
  { url: "https://www.kostat.go.kr", title: "Statistics Korea (KOSTAT)" },
  { url: "https://www.kdca.go.kr", title: "Korea Disease Control and Prevention Agency" },
  { url: "https://www.hira.or.kr", title: "Health Insurance Review & Assessment Service" },
  { url: "https://www.kipo.go.kr", title: "Korean Intellectual Property Office" },
  { url: "https://www.kisa.or.kr", title: "Korea Internet & Security Agency" },
  { url: "https://www.nia.or.kr", title: "National Information Society Agency" },

  { url: "https://www.egov.go.kr", title: "e-Government services" },
  { url: "https://www.minwon.go.kr", title: "Civil service portal (Minwon24)" },

    // Japan – Government & Public Sector
  // Central Government & Core Portals
  { url: "https://www.kantei.go.jp", title: "Prime Minister's Office of Japan" },
  { url: "https://www.naikaku.go.jp", title: "Cabinet Secretariat" },
  { url: "https://www.shugiin.go.jp", title: "House of Representatives" },
  { url: "https://www.sangiin.go.jp", title: "House of Councillors" },
  { url: "https://www.cas.go.jp", title: "Cabinet Office" },

  // Major Ministries
  { url: "https://www.mofa.go.jp", title: "Ministry of Foreign Affairs" },
  { url: "https://www.mod.go.jp", title: "Ministry of Defense" },
  { url: "https://www.mof.go.jp", title: "Ministry of Finance" },
  { url: "https://www.mext.go.jp", title: "Ministry of Education, Culture, Sports, Science and Technology (MEXT)" },
  { url: "https://www.mhlw.go.jp", title: "Ministry of Health, Labour and Welfare" },
  { url: "https://www.meti.go.jp", title: "Ministry of Economy, Trade and Industry (METI)" },
  { url: "https://www.mlit.go.jp", title: "Ministry of Land, Infrastructure, Transport and Tourism" },
  { url: "https://www.maff.go.jp", title: "Ministry of Agriculture, Forestry and Fisheries" },
  { url: "https://www.env.go.jp", title: "Ministry of the Environment" },
  { url: "https://www.mic.go.jp", title: "Ministry of Internal Affairs and Communications" },

  // Key Agencies & Public Institutions
  { url: "https://www.nta.go.jp", title: "National Tax Agency" },
  { url: "https://www.customs.go.jp", title: "Japan Customs" },
  { url: "https://www.jpo.go.jp", title: "Japan Patent Office" },
  { url: "https://www.jma.go.jp", title: "Japan Meteorological Agency" },
  { url: "https://www.npa.go.jp", title: "National Police Agency" },
  { url: "https://www.stat.go.jp", title: "Statistics Bureau of Japan" },

  // Digital Government & e-Services
  { url: "https://www.digital.go.jp", title: "Digital Agency" },
  { url: "https://www.gov-online.go.jp", title: "My Number / e-Government services" },
  { url: "https://www.e-gov.go.jp", title: "e-Gov (electronic government)" },

    // Iceland – Government & Public Sector
  { url: "https://www.government.is", title: "Official Government of Iceland portal" },
  { url: "https://www.althingi.is", title: "Althingi (Icelandic Parliament)" },
  { url: "https://www.forseti.is", title: "Office of the President of Iceland" },
  { url: "https://www.stjornarrad.is", title: "Prime Minister's Office / Government Offices" },

  { url: "https://www.fjarmalaraduneyti.is", title: "Ministry of Finance and Economic Affairs" },
  { url: "https://www.utn.is", title: "Ministry of Foreign Affairs" },
  { url: "https://www.innri.is", title: "Ministry of the Interior" },
  { url: "https://www.menntamalaraduneyti.is", title: "Ministry of Education and Culture" },
  { url: "https://www.heilbrigdisraduneyti.is", title: "Ministry of Health" },
  { url: "https://www.atvinnuvegaraduneyti.is", title: "Ministry of Industries and Innovation" },
  { url: "https://www.umhverfisraduneyti.is", title: "Ministry for the Environment and Natural Resources" },

  { url: "https://www.skatturinn.is", title: "Directorate of Internal Revenue (Skatturinn)" },
  { url: "https://www.logreglan.is", title: "Icelandic Police" },
  { url: "https://www.hagstofa.is", title: "Statistics Iceland (Hagstofa Íslands)" },
  { url: "https://www.landlaeknir.is", title: "Directorate of Health" },
  { url: "https://www.fjs.is", title: "Government Financial Management Authority" },
  { url: "https://www.island.is", title: "Ísland.is (main citizen portal for e-services)" },

    // U.S. Government & Public Sector (new)
  { url: "https://www.usa.gov", title: "Official U.S. Government Portal" },
  { url: "https://www.whitehouse.gov", title: "The White House" },
  { url: "https://www.congress.gov", title: "U.S. Congress" },
  { url: "https://www.senate.gov", title: "U.S. Senate" },
  { url: "https://www.house.gov", title: "U.S. House of Representatives" },

  { url: "https://www.treasury.gov", title: "Department of the Treasury" },
  { url: "https://www.defense.gov", title: "Department of Defense" },
  { url: "https://www.state.gov", title: "Department of State" },
  { url: "https://www.justice.gov", title: "Department of Justice" },
  { url: "https://www.dhs.gov", title: "Department of Homeland Security" },
  { url: "https://www.hhs.gov", title: "Department of Health and Human Services" },
  { url: "https://www.dot.gov", title: "Department of Transportation" },
  { url: "https://www.doi.gov", title: "Department of the Interior" },
  { url: "https://www.usda.gov", title: "Department of Agriculture" },
  { url: "https://www.commerce.gov", title: "Department of Commerce" },
  { url: "https://www.dol.gov", title: "Department of Labor" },
  { url: "https://www.energy.gov", title: "Department of Energy" },
  { url: "https://www.va.gov", title: "Department of Veterans Affairs" },
  { url: "https://www.hud.gov", title: "Department of Housing and Urban Development" },

  { url: "https://www.irs.gov", title: "Internal Revenue Service (IRS)" },
  { url: "https://www.ssa.gov", title: "Social Security Administration (SSA)" },
  { url: "https://www.fda.gov", title: "Food and Drug Administration (FDA)" },
  { url: "https://www.nasa.gov", title: "National Aeronautics and Space Administration (NASA)" },
  { url: "https://www.fbi.gov", title: "Federal Bureau of Investigation (FBI)" },
  { url: "https://www.cia.gov", title: "Central Intelligence Agency (CIA)" },
  { url: "https://www.ftc.gov", title: "Federal Trade Commission (FTC)" },
  { url: "https://www.epa.gov", title: "Environmental Protection Agency (EPA)" },
  { url: "https://www.faa.gov", title: "Federal Aviation Administration (FAA)" },
  { url: "https://www.census.gov", title: "U.S. Census Bureau" },

  { url: "https://www.supremecourt.gov", title: "Supreme Court of the United States" },
  { url: "https://www.uscourts.gov", title: "U.S. Courts" },

    // U.S. Government – Additional Agencies & Independent Bodies (new)
  { url: "https://www.noaa.gov", title: "National Oceanic and Atmospheric Administration (NOAA)" },
  { url: "https://www.usgs.gov", title: "U.S. Geological Survey (USGS)" },
  { url: "https://www.nps.gov", title: "National Park Service (NPS)" },
  { url: "https://www.fws.gov", title: "U.S. Fish and Wildlife Service (FWS)" },
  { url: "https://www.blm.gov", title: "Bureau of Land Management (BLM)" },
  { url: "https://www.fema.gov", title: "Federal Emergency Management Agency (FEMA)" },
  { url: "https://www.tsa.gov", title: "Transportation Security Administration (TSA)" },
  { url: "https://www.cbp.gov", title: "U.S. Customs and Border Protection (CBP)" },
  { url: "https://www.ice.gov", title: "Immigration and Customs Enforcement (ICE)" },
  { url: "https://www.uscis.gov", title: "U.S. Citizenship and Immigration Services (USCIS)" },
  { url: "https://www.dea.gov", title: "Drug Enforcement Administration (DEA)" },
  { url: "https://www.atf.gov", title: "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF)" },
  { url: "https://www.cftc.gov", title: "Commodity Futures Trading Commission (CFTC)" },
  { url: "https://www.occ.treas.gov", title: "Office of the Comptroller of the Currency (OCC)" },
  { url: "https://www.samhsa.gov", title: "Substance Abuse and Mental Health Services Administration (SAMHSA)" },
  { url: "https://www.gpo.gov", title: "Government Publishing Office (GPO)" },
  { url: "https://www.archives.gov", title: "National Archives (NARA)" },

    // US Health & Medical – New Sources
  // Federal Government & National Public Health Agencies
  { url: "https://www.cms.gov", title: "Centers for Medicare & Medicaid Services (CMS)" },
  { url: "https://www.ahrq.gov", title: "Agency for Healthcare Research and Quality (AHRQ)" },
  { url: "https://www.hrsa.gov", title: "Health Resources and Services Administration (HRSA)" },
  { url: "https://www.surgeongeneral.gov", title: "Office of the Surgeon General" },
  { url: "https://health.gov/healthypeople", title: "Healthy People 2030" },
  { url: "https://clinicaltrials.gov", title: "ClinicalTrials.gov" },
  { url: "https://www.vaccines.gov", title: "Vaccines.gov" },
  { url: "https://www.phf.org", title: "Public Health Foundation" },
  { url: "https://www.usphs.gov", title: "U.S. Public Health Service (USPHS)" },

  // NIH Institutes (select key ones)
  { url: "https://www.cancer.gov", title: "National Cancer Institute (NCI)" },
  { url: "https://www.niaid.nih.gov", title: "National Institute of Allergy and Infectious Diseases (NIAID)" },
  { url: "https://www.nhlbi.nih.gov", title: "National Heart, Lung, and Blood Institute (NHLBI)" },
  { url: "https://www.niddk.nih.gov", title: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)" },
  { url: "https://www.nimh.nih.gov", title: "National Institute of Mental Health (NIMH)" },
  { url: "https://www.nia.nih.gov", title: "National Institute on Aging (NIA)" },
  { url: "https://www.nei.nih.gov", title: "National Eye Institute (NEI)" },
  { url: "https://www.niams.nih.gov", title: "National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)" },
  { url: "https://www.nichd.nih.gov", title: "Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)" },
  { url: "https://www.ninds.nih.gov", title: "National Institute of Neurological Disorders and Stroke (NINDS)" },

  // Major Hospitals & Academic Medical Centers
  { url: "https://www.clevelandclinic.org", title: "Cleveland Clinic" },
  { url: "https://www.hopkinsmedicine.org", title: "Johns Hopkins Medicine" },
  { url: "https://www.massgeneral.org", title: "Massachusetts General Hospital" },
  { url: "https://stanfordhealthcare.org", title: "Stanford Health Care" },
  { url: "https://www.ucsfhealth.org", title: "UCSF Health" },
  { url: "https://www.mdanderson.org", title: "MD Anderson Cancer Center" },
  { url: "https://www.mountsinai.org", title: "Mount Sinai Health System" },
  { url: "https://nyulangone.org", title: "NYU Langone Health" },
  { url: "https://www.brighamandwomens.org", title: "Brigham and Women's Hospital" },
  { url: "https://www.childrenshospital.org", title: "Boston Children's Hospital" },
  { url: "https://www.michiganmedicine.org", title: "Michigan Medicine" },
  { url: "https://www.uclahealth.org", title: "UCLA Health" },
  { url: "https://www.dukehealth.org", title: "Duke Health" },
  { url: "https://www.pennmedicine.org", title: "Penn Medicine" },
  { url: "https://www.columbiadoctors.org", title: "ColumbiaDoctors" },
  { url: "https://www.cedars-sinai.org", title: "Cedars‑Sinai" },
  { url: "https://www.northwesternmedicine.org", title: "Northwestern Medicine" },
  { url: "https://www.emoryhealthcare.org", title: "Emory Healthcare" },
  { url: "https://mayoclinichealthsystem.org", title: "Mayo Clinic Health System" },
  { url: "https://www.keckmedicine.org", title: "Keck Medicine of USC" },
  { url: "https://www.utswmedicine.org", title: "UT Southwestern Medical Center" },
  { url: "https://www.vumc.org", title: "Vanderbilt University Medical Center" },
  { url: "https://www.barnesjewish.org", title: "Barnes-Jewish Hospital" },
  { url: "https://www.upmc.com", title: "UPMC" },
  { url: "https://www.rush.edu", title: "Rush University Medical Center" },
  { url: "https://www.jeffersonhealth.org", title: "Jefferson Health" },
  { url: "https://www.hackensackmeridianhealth.org", title: "Hackensack Meridian Health" },
  { url: "https://www.adventhealth.com", title: "AdventHealth" },
  { url: "https://healthy.kaiserpermanente.org", title: "Kaiser Permanente" },

  // State & Territorial Health Departments (select examples; full 50 states can be added)
  { url: "https://www.health.ny.gov", title: "New York State Department of Health" },
  { url: "https://www.dhcs.ca.gov", title: "California Department of Health Care Services" },
  { url: "https://www.dshs.texas.gov", title: "Texas Department of State Health Services" },
  { url: "https://www.floridahealth.gov", title: "Florida Department of Health" },
  { url: "https://www.health.state.mn.us", title: "Minnesota Department of Health" },
  { url: "https://dph.illinois.gov", title: "Illinois Department of Public Health" },
  { url: "https://www.health.pa.gov", title: "Pennsylvania Department of Health" },
  { url: "https://www.mass.gov/orgs/department-of-public-health", title: "Massachusetts Department of Public Health" },
  { url: "https://odh.ohio.gov", title: "Ohio Department of Health" },
  { url: "https://www.michigan.gov/mdhhs", title: "Michigan Department of Health and Human Services" },

  // Disease-Specific Organizations & Foundations
  { url: "https://www.heart.org", title: "American Heart Association" },
  { url: "https://www.cancer.org", title: "American Cancer Society" },
  { url: "https://www.diabetes.org", title: "American Diabetes Association" },
  { url: "https://www.alz.org", title: "Alzheimer's Association" },
  { url: "https://www.arthritis.org", title: "Arthritis Foundation" },
  { url: "https://www.lung.org", title: "American Lung Association" },
  { url: "https://www.kidney.org", title: "National Kidney Foundation" },
  { url: "https://www.nationalmssociety.org", title: "National Multiple Sclerosis Society" },
  { url: "https://www.crohnscolitisfoundation.org", title: "Crohn's & Colitis Foundation" },
  { url: "https://www.parkinson.org", title: "Parkinson's Foundation" },
  { url: "https://www.sicklecell.org", title: "Sickle Cell Disease Association of America" },
  { url: "https://www.cysticfibrosis.org", title: "Cystic Fibrosis Foundation" },
  { url: "https://www.lls.org", title: "Leukemia & Lymphoma Society" },
  { url: "https://www.breastcancer.org", title: "Breastcancer.org" },
  { url: "https://mhanational.org", title: "Mental Health America" },
  { url: "https://www.nami.org", title: "National Alliance on Mental Illness (NAMI)" },

  // Professional Medical Associations & Societies
  { url: "https://www.ama-assn.org", title: "American Medical Association (AMA)" },
  { url: "https://www.aafp.org", title: "American Academy of Family Physicians (AAFP)" },
  { url: "https://www.acponline.org", title: "American College of Physicians (ACP)" },
  { url: "https://www.acog.org", title: "American College of Obstetricians and Gynecologists (ACOG)" },
  { url: "https://www.aap.org", title: "American Academy of Pediatrics (AAP)" },
  { url: "https://www.facs.org", title: "American College of Surgeons (ACS)" },
  { url: "https://www.apa.org", title: "American Psychological Association (APA)" },
  { url: "https://www.aanp.org", title: "American Association of Nurse Practitioners (AANP)" },
  { url: "https://www.apha.org", title: "American Public Health Association (APHA)" },
  { url: "https://www.ashp.org", title: "American Society of Health-System Pharmacists (ASHP)" },
  { url: "https://www.idsociety.org", title: "Infectious Diseases Society of America (IDSA)" },

  // Regulatory, Accreditation & Oversight Bodies
  { url: "https://www.jointcommission.org", title: "The Joint Commission" },
  { url: "https://www.urac.org", title: "URAC" },
  { url: "https://www.ncqa.org", title: "National Committee for Quality Assurance (NCQA)" },
  { url: "https://www.usp.org", title: "U.S. Pharmacopeia (USP)" },

  // Medical Journals & Research Databases
  { url: "https://jamanetwork.com", title: "JAMA Network" },
  { url: "https://www.nejm.org", title: "New England Journal of Medicine (NEJM)" },
  { url: "https://www.cochrane.org", title: "Cochrane" },
  { url: "https://www.annals.org", title: "Annals of Internal Medicine" },
  { url: "https://www.thelancet.com", title: "The Lancet (US content)" },

  // Consumer Health & Education Portals (new)
  { url: "https://www.healthline.com", title: "Healthline" },
  { url: "https://www.mayoclinic.org/patient-care-and-health-information", title: "Mayo Clinic Patient Care & Health Information" },
  { url: "https://www.familydoctor.org", title: "FamilyDoctor.org" },
  { url: "https://www.kidshealth.org", title: "KidsHealth" },
  { url: "https://www.myplate.gov", title: "MyPlate (Nutrition)" },
  { url: "https://www.eatright.org", title: "Academy of Nutrition and Dietetics" },

  // Additional Specialized Resources
  { url: "https://www.va.gov/health-care", title: "Veterans Health Administration" },
  { url: "https://www.tricare.mil", title: "TRICARE" },
  { url: "https://www.healthit.gov", title: "Health IT" },
  { url: "https://www.ruralhealthinfo.org", title: "Rural Health Information Hub" },
  { url: "https://www.minorityhealth.hhs.gov", title: "Office of Minority Health" },
  { url: "https://www.womenshealth.gov", title: "Office on Women's Health" },
  { url: "https://health.gov", title: "Office of Disease Prevention and Health Promotion" },
  { url: "https://prevention.nih.gov", title: "NIH Office of Disease Prevention" },

    // UK Health & Medical – New Sources
  // National Government & Public Health Agencies (new domains/subpages)
  { url: "https://www.ukhsa.gov.uk", title: "UK Health Security Agency (UKHSA)" },
  { url: "https://www.scot.nhs.uk", title: "NHS Scotland" },
  { url: "https://www.wales.nhs.uk", title: "NHS Wales" },
  { url: "https://www.health-ni.gov.uk", title: "Health and Social Care Northern Ireland" },
  { url: "https://www.medicines.org.uk", title: "Medicines and Healthcare products Regulatory Agency (MHRA) – Public Information" },
  { url: "https://www.gov.uk/government/organisations/mhra", title: "MHRA – Official Regulator Page" },
  { url: "https://www.digital.nhs.uk", title: "NHS Digital" },
  { url: "https://www.improvement.nhs.uk", title: "NHS Improvement" },
  { url: "https://www.hscic.gov.uk", title: "NHS Digital (legacy HSCIC)" },

  // Major Hospitals & Academic Medical Centres
  { url: "https://www.uclh.nhs.uk", title: "University College London Hospitals" },
  { url: "https://www.gstt.nhs.uk", title: "Guy's and St Thomas' NHS Foundation Trust" },
  { url: "https://www.mft.nhs.uk", title: "Manchester University NHS Foundation Trust" },
  { url: "https://www.uhb.nhs.uk", title: "University Hospitals Birmingham" },
  { url: "https://www.imperial.nhs.uk", title: "Imperial College Healthcare NHS Trust" },
  { url: "https://www.papworthhospital.nhs.uk", title: "Royal Papworth Hospital" },
  { url: "https://www.leedsth.nhs.uk", title: "Leeds Teaching Hospitals" },
  { url: "https://www.nuh.nhs.uk", title: "Nottingham University Hospitals" },
  { url: "https://www.sheffield.nhs.uk", title: "Sheffield Teaching Hospitals" },
  { url: "https://www.cambridgeuniversityhospitals.nhs.uk", title: "Cambridge University Hospitals (Addenbrooke's)" },
  { url: "https://www.oxforduniversityhospitals.nhs.uk", title: "Oxford University Hospitals" },
  { url: "https://www.kingshealthpartners.org", title: "King's Health Partners" },
  { url: "https://www.bartshealth.nhs.uk", title: "Barts Health NHS Trust" },
  { url: "https://www.gosh.nhs.uk", title: "Great Ormond Street Hospital for Children" },
  { url: "https://www.royalfree.nhs.uk", title: "Royal Free London NHS Foundation Trust" },
  { url: "https://www.moorfields.nhs.uk", title: "Moorfields Eye Hospital" },
  { url: "https://www.royalmarsden.nhs.uk", title: "The Royal Marsden (Cancer specialist)" },

  // Research Institutes & Funding Bodies (new)
  { url: "https://www.wellcome.org", title: "Wellcome Trust" },
  { url: "https://www.nihr.ac.uk", title: "National Institute for Health and Care Research (NIHR)" },
  { url: "https://www.cruk.org", title: "Cancer Research UK" },
  { url: "https://www.bhf.org.uk", title: "British Heart Foundation" },
  { url: "https://www.alzheimersresearchuk.org", title: "Alzheimer's Research UK" },
  { url: "https://www.diabetes.org.uk", title: "Diabetes UK" },
  { url: "https://www.versusarthritis.org", title: "Versus Arthritis" },
  { url: "https://www.parkinsons.org.uk", title: "Parkinson's UK" },
  { url: "https://www.stroke.org.uk", title: "Stroke Association" },

  // Professional Medical Associations & Royal Colleges
  { url: "https://www.bma.org.uk", title: "British Medical Association (BMA)" },
  { url: "https://www.rcplondon.ac.uk", title: "Royal College of Physicians (RCP)" },
  { url: "https://www.rcseng.ac.uk", title: "Royal College of Surgeons of England (RCS)" },
  { url: "https://www.rcog.org.uk", title: "Royal College of Obstetricians and Gynaecologists (RCOG)" },
  { url: "https://www.rcpch.ac.uk", title: "Royal College of Paediatrics and Child Health (RCPCH)" },
  { url: "https://www.rcpsych.ac.uk", title: "Royal College of Psychiatrists (RCPsych)" },
  { url: "https://www.rcgp.org.uk", title: "Royal College of General Practitioners (RCGP)" },
  { url: "https://www.rcn.org.uk", title: "Royal College of Nursing (RCN)" },
  { url: "https://www.rpharms.com", title: "Royal Pharmaceutical Society (RPS)" },
  { url: "https://www.britishgeriatrics.org.uk", title: "British Geriatrics Society" },
  { url: "https://www.britishcardiovascularsociety.org.uk", title: "British Cardiovascular Society" },
  { url: "https://www.britishinfection.org", title: "British Infection Association" },

  // Disease-Specific & Charity Organizations (new)
  { url: "https://www.alzheimers.org.uk", title: "Alzheimer's Society" },
  { url: "https://www.mind.org.uk", title: "Mind (mental health)" },
  { url: "https://www.macmillan.org.uk", title: "Macmillan Cancer Support" },
  { url: "https://www.terrencehiggins.org.uk", title: "Terrence Higgins Trust (HIV)" },
  { url: "https://www.asthma.org.uk", title: "Asthma + Lung UK (formerly Asthma UK)" },
  { url: "https://www.blf.org.uk", title: "British Lung Foundation" },
  { url: "https://www.epilepsy.org.uk", title: "Epilepsy Society" },
  { url: "https://www.coeliac.org.uk", title: "Coeliac UK" },
  { url: "https://www.crohnsandcolitis.org.uk", title: "Crohn's & Colitis UK" },

  // Regulatory, Accreditation & Oversight (new)
  { url: "https://www.cqc.org.uk", title: "Care Quality Commission (CQC)" },
  { url: "https://www.bnf.nice.org.uk", title: "British National Formulary (BNF)" },
  { url: "https://www.evidence.nhs.uk", title: "NICE Evidence Search" },

  // Medical Journals & Research Databases (UK-focused)
  { url: "https://www.bmj.com", title: "The BMJ" },
  { url: "https://www.onlinelibrary.wiley.com", title: "Wiley Online Library (UK journals)" },
  { url: "https://www.cochranelibrary.com", title: "Cochrane Library" },

  // Consumer Health & Education Portals (new)
  { url: "https://www.nhs.uk/conditions", title: "NHS – Health A-Z (Conditions)" },
  { url: "https://www.nhs.uk/live-well", title: "NHS – Live Well (Healthy Living)" },
  { url: "https://www.patient.info", title: "Patient.info (Patient UK)" },
  { url: "https://www.healthtalk.org", title: "Healthtalk.org" },
  { url: "https://www.behindtheheadlines.org.uk", title: "Behind the Headlines (NHS evidence-based news)" },

  // Additional Specialized Resources (new)
  { url: "https://www.gov.uk/government/collections/nhs-england", title: "NHS England Policy & Guidance" },
  { url: "https://www.scot.nhs.uk/public-health", title: "NHS Scotland Public Health" },
  { url: "https://www.publichealthwales.org.uk", title: "Public Health Wales" },
  { url: "https://www.nidirect.gov.uk/articles/health-and-social-care", title: "NI Direct – Health and Social Care" },

    // Canada – Health & Medical (new)
  // Federal Government & National Agencies
  { url: "https://www.canada.ca/en/health.html", title: "Health Canada – Main Portal" },
  { url: "https://www.phac-aspc.gc.ca", title: "Public Health Agency of Canada (PHAC)" },
  { url: "https://www.cihi.ca", title: "Canadian Institute for Health Information (CIHI)" },
  { url: "https://www.canada.ca/en/public-health", title: "Public Health – Government of Canada" },
  { url: "https://www.hc-sc.gc.ca", title: "Health Canada (HC-SC)" },
  { url: "https://www.canada.ca/en/services/health", title: "Canada.ca – Health Services" },
  { url: "https://www.drugshortagescanada.ca", title: "Drug Shortages Canada" },
  { url: "https://www.canada.ca/en/health-canada/services/drugs-health-products", title: "Health Canada – Drugs & Health Products" },
  { url: "https://www.ic.gc.ca", title: "Innovation, Science and Economic Development Canada (Health Tech)" },
  { url: "https://www.statcan.gc.ca", title: "Statistics Canada – Health Statistics" },

  // Major Hospitals & Academic Medical Centres
  { url: "https://www.uhn.ca", title: "University Health Network (Toronto General)" },
  { url: "https://www.sunnybrook.ca", title: "Sunnybrook Health Sciences Centre" },
  { url: "https://www.sickkids.ca", title: "Hospital for Sick Children (SickKids)" },
  { url: "https://www.mountsinai.on.ca", title: "Mount Sinai Hospital Toronto" },
  { url: "https://www.torontocentralhealthline.ca", title: "Toronto Central Healthline" },
  { url: "https://www.ottawaheart.ca", title: "University of Ottawa Heart Institute" },
  { url: "https://www.mcgill.ca", title: "McGill University Health Centre" },
  { url: "https://www.muhc.ca", title: "McGill University Health Centre (MUHC)" },
  { url: "https://www.umanitoba.ca", title: "Health Sciences Centre Winnipeg" },
  { url: "https://www.albertahealthservices.ca", title: "Alberta Health Services" },
  { url: "https://www.vch.ca", title: "Vancouver Coastal Health" },
  { url: "https://www.providencehealthcare.org", title: "Providence Health Care (BC)" },
  { url: "https://www.kingstonhsc.ca", title: "Kingston Health Sciences Centre" },
  { url: "https://www.hamiltonhealthsciences.ca", title: "Hamilton Health Sciences" },
  { url: "https://www.unityhealth.to", title: "Unity Health Toronto" },
  { url: "https://www.sinaihealth.ca", title: "Sinai Health" },
  { url: "https://www.womenscollegehospital.ca", title: "Women's College Hospital" },
  { url: "https://www.camh.ca", title: "Centre for Addiction and Mental Health (CAMH)" },
  { url: "https://www.baycrest.org", title: "Baycrest" },

  // Provincial & Territorial Health Authorities (using official domains)
  { url: "https://www.ontario.ca/page/ministry-health", title: "Ontario Ministry of Health" },
  { url: "https://www.alberta.ca/health", title: "Alberta Health" },
  { url: "https://www.gov.bc.ca/health", title: "British Columbia Ministry of Health" },
  { url: "https://www.quebec.ca/sante", title: "Santé Québec" },
  { url: "https://www.saskatchewan.ca/government/health", title: "Saskatchewan Health" },
  { url: "https://www.gov.mb.ca/health", title: "Manitoba Health" },
  { url: "https://www.novascotia.ca/dhw", title: "Nova Scotia Department of Health and Wellness" },
  { url: "https://www2.gnb.ca", title: "New Brunswick Health" },
  { url: "https://www.gov.nl.ca/health", title: "Newfoundland & Labrador Department of Health and Community Services" },
  { url: "https://www.princeedwardisland.ca", title: "PEI Health" },
  { url: "https://www.yukon.ca/en/health-and-social-services", title: "Yukon Health and Social Services" },
  { url: "https://www.gov.nt.ca", title: "Northwest Territories Health and Social Services" },
  { url: "https://www.gov.nu.ca", title: "Nunavut Health" },

  // Research Institutes & Funding Bodies
  { url: "https://www.cihr-irsc.gc.ca", title: "Canadian Institutes of Health Research (CIHR)" },
  { url: "https://www.nserc-crsng.gc.ca", title: "Natural Sciences and Engineering Research Council (NSERC)" },
  { url: "https://www.genomebc.ca", title: "Genome BC" },
  { url: "https://www.genomequebec.com", title: "Génome Québec" },
  { url: "https://www.ontario.ca/page/ontario-research-fund", title: "Ontario Research Fund" },
  { url: "https://www.frq.gouv.qc.ca", title: "Fonds de recherche du Québec – Santé" },
  { url: "https://www.partnershipagainstcancer.ca", title: "Canadian Partnership Against Cancer" },
  { url: "https://www.braincanada.ca", title: "Brain Canada" },
  { url: "https://www.stemcellnetwork.ca", title: "Stem Cell Network" },

  // Disease-Specific Organizations & Foundations
  { url: "https://www.heartandstroke.ca", title: "Heart & Stroke Foundation" },
  { url: "https://www.cancer.ca", title: "Canadian Cancer Society" },
  { url: "https://www.diabetes.ca", title: "Diabetes Canada" },
  { url: "https://www.alzheimer.ca", title: "Alzheimer Society of Canada" },
  { url: "https://www.arthritis.ca", title: "Arthritis Society Canada" },
  { url: "https://www.lung.ca", title: "Canadian Lung Association" },
  { url: "https://www.kidneycanada.ca", title: "Kidney Cancer Canada (also Kidney Foundation exists, but this is from list)" },
  { url: "https://www.mssociety.ca", title: "Multiple Sclerosis Society of Canada" },
  { url: "https://www.parkinson.ca", title: "Parkinson Canada" },
  { url: "https://www.crohnsandcolitis.ca", title: "Crohn's and Colitis Canada" },
  { url: "https://www.camh.ca", title: "CAMH (Mental Health) – already listed, but included for completeness" },
  { url: "https://www.cmha.ca", title: "Canadian Mental Health Association" },
  { url: "https://www.cysticfibrosis.ca", title: "Cystic Fibrosis Canada" },
  { url: "https://www.epilepsy.ca", title: "Epilepsy Canada" },

  // Professional Medical Associations & Colleges
  { url: "https://www.cma.ca", title: "Canadian Medical Association (CMA)" },
  { url: "https://www.cfpc.ca", title: "College of Family Physicians of Canada (CFPC)" },
  { url: "https://www.royalcollege.ca", title: "Royal College of Physicians and Surgeons of Canada" },
  { url: "https://www.cna-aiic.ca", title: "Canadian Nurses Association (CNA)" },
  { url: "https://www.caphcr.ca", title: "Canadian Association of Provincial Cancer Agencies (CAPCA)" },
  { url: "https://www.cps.ca", title: "Canadian Paediatric Society" },
  { url: "https://www.canadiangeriatrics.ca", title: "Canadian Geriatrics Society" },
  { url: "https://www.cacp.ca", title: "Canadian Association of Community Pharmacists (CACP)" },
  { url: "https://www.csih.ca", title: "Canadian Society for International Health (CSIH)" },

  // Regulatory & Oversight Bodies
  { url: "https://www.napra.ca", title: "National Association of Pharmacy Regulatory Authorities (NAPRA)" },
  { url: "https://www.ccohs.ca", title: "Canadian Centre for Occupational Health and Safety (CCOHS)" },
  { url: "https://www.patientombudsman.ca", title: "Patient Ombudsman (Ontario)" },

  // Medical Journals & Research Databases (Canadian-specific)
  { url: "https://www.cmaj.ca", title: "Canadian Medical Association Journal (CMAJ)" },
  { url: "https://www.cmajopen.ca", title: "CMAJ Open" },
  { url: "https://www.jmir.org", title: "Journal of Medical Internet Research (JMIR) – Canadian studies" },

  // Consumer Health & Education Portals
  { url: "https://www.healthycanadians.gc.ca", title: "Healthy Canadians" },
  { url: "https://www.aboutkidshealth.ca", title: "AboutKidsHealth" },
  { url: "https://www.myhealth.alberta.ca", title: "MyHealth.Alberta.ca" },
  { url: "https://www.healthlinkbc.ca", title: "HealthLink BC" },
  { url: "https://www.ontario.ca/page/health-care-ontario", title: "Health Care Ontario" },

  // Additional Specialized Resources
  { url: "https://www.canada.ca/en/services/health/covid-19", title: "Canada.ca – COVID-19 (pandemic archives)" },
  { url: "https://www.infobase.phac-aspc.gc.ca", title: "Public Health Infobase" },
  { url: "https://www.secure.cihi.ca", title: "CIHI Data Portal" },

    // Germany – Health & Medical (new)
  // Federal Government & National Agencies
  { url: "https://www.bundesgesundheitsministerium.de", title: "Federal Ministry of Health (BMG)" },
  { url: "https://www.rki.de", title: "Robert Koch Institute (RKI)" },
  { url: "https://www.bfarm.de", title: "Federal Institute for Drugs and Medical Devices (BfArM)" },
  { url: "https://www.pei.de", title: "Paul-Ehrlich-Institut (vaccines & biomedicines)" },
  { url: "https://www.iqwig.de", title: "Institute for Quality and Efficiency in Health Care (IQWiG)" },
  { url: "https://www.g-ba.de", title: "Federal Joint Committee (G-BA)" },
  { url: "https://www.dimdi.de", title: "German Institute of Medical Documentation and Information (DIMDI)" },
  { url: "https://www.zaeq.de", title: "Central Institute for Quality Assurance (ZÄQ)" },

  // Major University Hospitals & Medical Centres
  { url: "https://www.charite.de", title: "Charité – Universitätsmedizin Berlin" },
  { url: "https://www.uniklinik-heidelberg.de", title: "University Hospital Heidelberg" },
  { url: "https://www.uniklinikum-dresden.de", title: "University Hospital Dresden" },
  { url: "https://www.uniklinik-freiburg.de", title: "University Hospital Freiburg" },
  { url: "https://www.klinikum.uni-muenchen.de", title: "LMU Munich University Hospital" },
  { url: "https://www.med.uni-muenchen.de", title: "Technical University Munich – Medical Center" },
  { url: "https://www.uk-essen.de", title: "University Hospital Essen" },
  { url: "https://www.uniklinik-tuebingen.de", title: "University Hospital Tübingen" },
  { url: "https://www.uniklinikum-wuerzburg.de", title: "University Hospital Würzburg" },
  { url: "https://www.uniklinik-koeln.de", title: "University Hospital Cologne" },
  { url: "https://www.medizin.uni-leipzig.de", title: "University Hospital Leipzig" },
  { url: "https://www.uniklinikum-jena.de", title: "University Hospital Jena" },
  { url: "https://www.uke.de", title: "University Medical Center Hamburg-Eppendorf (UKE)" },
  { url: "https://www.mhh.de", title: "Hannover Medical School (MHH)" },
  { url: "https://www.uniklinik-duesseldorf.de", title: "University Hospital Düsseldorf" },
  { url: "https://www.ukmuenster.de", title: "University Hospital Münster" },
  { url: "https://www.uniklinik-rwth-aachen.de", title: "University Hospital RWTH Aachen" },
  { url: "https://www.deutsches-krankenhausverzeichnis.de", title: "German Hospital Directory" },

  // State-Level Health Authorities (examples – 16 states; key ones added)
  { url: "https://www.berlin.de", title: "Berlin Health Services" },
  { url: "https://www.bayern.de", title: "Bavaria Health" },
  { url: "https://www.nrw.de", title: "North Rhine-Westphalia Health" },
  { url: "https://www.baden-wuerttemberg.de", title: "Baden-Württemberg Health" },
  { url: "https://www.hessen.de", title: "Hesse Health" },
  { url: "https://www.sachsen.de", title: "Saxony Health" },
  { url: "https://www.niedersachsen.de", title: "Lower Saxony Health" },

  // Research Institutes & Funding Bodies
  { url: "https://www.mpg.de", title: "Max Planck Society (medical institutes)" },
  { url: "https://www.helmholtz.de", title: "Helmholtz Association (health research)" },
  { url: "https://www.dfg.de", title: "German Research Foundation (DFG)" },
  { url: "https://www.dzne.de", title: "German Center for Neurodegenerative Diseases (DZNE)" },
  { url: "https://www.dkfz.de", title: "German Cancer Research Center (DKFZ)" },
  { url: "https://www.dzhk.de", title: "German Centre for Cardiovascular Research (DZHK)" },
  { url: "https://www.dzif.de", title: "German Centre for Infection Research (DZIF)" },
  { url: "https://www.fraunhofer.de", title: "Fraunhofer (health-related institutes)" },
  { url: "https://www.leibniz-gemeinschaft.de", title: "Leibniz Association" },

  // Disease-Specific Organizations & Foundations
  { url: "https://www.deutschekrebshilfe.de", title: "German Cancer Aid" },
  { url: "https://www.herzstiftung.de", title: "German Heart Foundation" },
  { url: "https://www.diabetes-deutschland.de", title: "Diabetes Germany" },
  { url: "https://www.deutsche-alzheimer.de", title: "German Alzheimer Society" },
  { url: "https://www.deutsche-multiple-sklerose-gesellschaft.de", title: "German Multiple Sclerosis Society" },
  { url: "https://www.drk.de", title: "German Red Cross (DRK)" },
  { url: "https://www.aktion-deutschland-hilft.de", title: "Aktion Deutschland Hilft (health-related aid)" },

  // Professional Medical Associations & Chambers
  { url: "https://www.bundesaerztekammer.de", title: "German Medical Association (BÄK)" },
  { url: "https://www.aerztekammern.de", title: "State Medical Chambers" },
  { url: "https://www.dgim.de", title: "German Society of Internal Medicine (DGIM)" },
  { url: "https://www.dgn.org", title: "German Society of Neurology (DGN)" },
  { url: "https://www.dgch.de", title: "German Society of Surgery (DGCH)" },
  { url: "https://www.deutsche-gesellschaft-fuer-chirurgie.de", title: "German Society for Surgery" },
  { url: "https://www.kbv.de", title: "National Association of Statutory Health Insurance Physicians (KBV)" },

  // Health Insurers with Public Health Information (large funds)
  { url: "https://www.aok.de", title: "AOK Health Insurance" },
  { url: "https://www.tk.de", title: "Techniker Krankenkasse (TK) Health Portal" },
  { url: "https://www.barmer.de", title: "Barmer Health Information" },

  // Medical Journals & Research Databases (Germany-focused)
  { url: "https://www.aerzteblatt.de", title: "Deutsches Ärzteblatt" },
  { url: "https://www.springer.com", title: "Springer (German medical journals)" },
  { url: "https://www.thieme.de", title: "Thieme (medical publishers)" },
  { url: "https://www.deutschesaerzteblatt.de", title: "Deutsches Ärzteblatt (alternative domain)" },

  // Consumer Health & Patient Information Portals
  { url: "https://gesund.bund.de", title: "Federal Health Portal (gesund.bund.de)" },
  { url: "https://www.patienten-information.de", title: "Patient Information Portal" },
  { url: "https://www.onkopedia.com", title: "Onkopedia (cancer guidelines)" },
  { url: "https://www.gesundheitsinformation.de", title: "IQWiG Patient Information (gesundheitsinformation.de)" },
  { url: "https://www.apotheken-umschau.de", title: "Apotheken Umschau" },

  // Additional Specialized Resources
  { url: "https://www.ebm-netzwerk.de", title: "German Network for Evidence-Based Medicine" },
  { url: "https://www.leitlinien.de", title: "National Care Guidelines (Versorgungsleitlinien)" },

    // India – Health & Medical (new)
  // Central Government & National Agencies
  { url: "https://www.mohfw.gov.in", title: "Ministry of Health and Family Welfare" },
  { url: "https://www.nhm.gov.in", title: "National Health Mission (NHM)" },
  { url: "https://www.icmr.gov.in", title: "Indian Council of Medical Research (ICMR)" },
  { url: "https://www.cdsco.gov.in", title: "Central Drugs Standard Control Organisation (CDSCO)" },
  { url: "https://www.ncdc.gov.in", title: "National Centre for Disease Control (NCDC)" },
  { url: "https://www.aiims.edu", title: "All India Institute of Medical Sciences (AIIMS), Delhi" },
  { url: "https://www.pib.gov.in", title: "Press Information Bureau – Health Releases" },
  { url: "https://www.jssk.nhm.gov.in", title: "Janani Shishu Suraksha Karyakram (JSSK)" },
  { url: "https://www.pmjay.gov.in", title: "Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)" },

  // Major Hospitals & Medical Institutions
  { url: "https://www.aiimsjodhpur.edu.in", title: "AIIMS Jodhpur" },
  { url: "https://www.aiimspatna.edu.in", title: "AIIMS Patna" },
  { url: "https://www.pgimer.edu.in", title: "PGIMER Chandigarh" },
  { url: "https://www.sgpgims.in", title: "Sanjay Gandhi Postgraduate Institute of Medical Sciences, Lucknow" },
  { url: "https://www.nimhans.ac.in", title: "NIMHANS Bengaluru" },
  { url: "https://www.tmc.gov.in", title: "Tata Memorial Centre (Cancer Hospital), Mumbai" },
  { url: "https://www.cmc.edu.in", title: "Christian Medical College, Vellore" },
  { url: "https://www.apollohospitals.com", title: "Apollo Hospitals" },
  { url: "https://www.fortishealthcare.com", title: "Fortis Healthcare" },
  { url: "https://www.narayanahealth.org", title: "Narayana Health" },
  { url: "https://www.medanta.org", title: "Medanta – The Medicity" },
  { url: "https://www.maxhealthcare.in", title: "Max Healthcare" },
  { url: "https://www.lilavatihospital.com", title: "Lilavati Hospital & Research Centre" },
  { url: "https://www.hindujahospital.com", title: "Hinduja Hospital" },
  { url: "https://www.sankaraeye.com", title: "Sankara Nethralaya" },
  { url: "https://www.lvpei.org", title: "L V Prasad Eye Institute" },

  // State Health Departments & Missions
  { url: "https://health.delhi.gov.in", title: "Delhi Health Department" },
  { url: "https://www.arogyasri.telangana.gov.in", title: "Telangana Aarogyasri Health Scheme" },
  { url: "https://nhm.assam.gov.in", title: "NHM Assam" },
  { url: "https://health.up.gov.in", title: "Uttar Pradesh Health Department" },
  { url: "https://www.punjab.gov.in", title: "Punjab Government – Health" },
  { url: "https://www.karnataka.gov.in", title: "Karnataka Government – Health" },
  { url: "https://www.kerala.gov.in", title: "Kerala Government – Health" },
  { url: "https://www.gujarat.gov.in", title: "Gujarat Government – Health" },

  // Research Institutes & Councils
  { url: "https://www.niti.gov.in", title: "NITI Aayog – Health Policy" },
  { url: "https://www.dbtindia.gov.in", title: "Department of Biotechnology" },
  { url: "https://www.dst.gov.in", title: "Department of Science & Technology" },
  { url: "https://www.csir.res.in", title: "CSIR (Council of Scientific & Industrial Research)" },
  { url: "https://www.iisc.ac.in", title: "Indian Institute of Science" },
  { url: "https://www.iitkgp.ac.in", title: "IIT Kharagpur" },
  { url: "https://www.iitd.ac.in", title: "IIT Delhi" },
  { url: "https://www.thsti.res.in", title: "Translational Health Science and Technology Institute" },
  { url: "https://www.rguhs.ac.in", title: "Rajiv Gandhi University of Health Sciences" },

  // Disease-Specific Organizations & Programs
  { url: "https://www.naco.gov.in", title: "National AIDS Control Organisation (NACO)" },
  { url: "https://www.rntcp.org", title: "National TB Elimination Programme (NTEP)" },
  { url: "https://www.tb.gov.in", title: "Central TB Division" },
  { url: "https://www.npcDCS.in", title: "National Programme for Prevention and Control of Cancer, Diabetes, Cardiovascular Diseases & Stroke" },
  { url: "https://www.nhp.gov.in", title: "National Health Portal" },
  { url: "https://www.cancerindia.org.in", title: "Cancer India" },
  { url: "https://www.diabetesindia.org", title: "Diabetes India" },
  { url: "https://www.heartcarefoundation.org", title: "Heart Care Foundation of India" },

  // Professional Medical Associations
  { url: "https://www.ima-india.org", title: "Indian Medical Association (IMA)" },
  { url: "https://www.apiindia.org", title: "Association of Physicians of India (API)" },
  { url: "https://www.iaps.net.in", title: "Indian Academy of Pediatrics (IAP)" },
  { url: "https://www.ficsonline.org", title: "Fellowship of Indian College of Surgeons (FICS)" },
  { url: "https://www.cardiologicalsocietyofindia.org", title: "Cardiological Society of India (CSI)" },
  { url: "https://www.neurologicalsocietyofindia.com", title: "Neurological Society of India" },

  // Regulatory & Quality Bodies
  { url: "https://www.nabh.co", title: "National Accreditation Board for Hospitals & Healthcare Providers (NABH)" },
  { url: "https://www.nmc.org.in", title: "National Medical Commission (NMC)" },
  { url: "https://www.pci.nic.in", title: "Pharmacy Council of India" },
  { url: "https://www.inc.nic.in", title: "Indian Nursing Council" },

  // Medical Journals & Research Databases
  { url: "https://www.ijmr.org.in", title: "Indian Journal of Medical Research (IJMR)" },
  { url: "https://www.ncbi.nlm.nih.gov", title: "NCBI (PubMed with Indian research)" },
  { url: "https://www.medknow.com", title: "Medknow Publications" },
  { url: "https://www.indianjournals.com", title: "IndianJournals.com" },
  { url: "https://www.japi.org", title: "Journal of the Association of Physicians of India (JAPI)" },

  // Consumer Health & Information Portals
  { url: "https://www.mohfw.gov.in/ayush", title: "AYUSH – Traditional Medicine Portal" },
  { url: "https://www.fitindia.gov.in", title: "Fit India Movement (Health)" },
  { url: "https://www.mygov.in", title: "MyGov – Health Sections" },
  { url: "https://www.vikaspedia.in/health", title: "Vikaspedia Health Knowledge Portal" },
  { url: "https://www.india.gov.in/topics/health", title: "India.gov.in – Health Topics" },
  { url: "https://www.ayush.gov.in", title: "Ministry of AYUSH" },

    // Australia – Health & Medical (new)
  // National Agencies & Organisations (new)
  { url: "https://www.aihw.gov.au", title: "Australian Institute of Health and Welfare (AIHW)" },
  { url: "https://www.healthdirect.gov.au", title: "Healthdirect Australia" },
  { url: "https://www.safetyandquality.gov.au", title: "Australian Commission on Safety and Quality in Health Care" },
  { url: "https://www.phaa.org.au", title: "Public Health Association of Australia" },
  { url: "https://www.digitalhealth.gov.au", title: "Australian Digital Health Agency" },

  // Major Hospitals & Medical Centres
  { url: "https://www.rch.org.au", title: "Royal Children’s Hospital Melbourne" },
  { url: "https://www.swslhd.health.nsw.gov.au", title: "South Western Sydney Local Health District (Liverpool Hospital)" },
  { url: "https://www.themh.org.au", title: "Royal Melbourne Hospital (Melbourne Health)" },
  { url: "https://www.metronorth.health.qld.gov.au", title: "Metro North Health (Royal Brisbane and Women’s Hospital)" },
  { url: "https://www.wslhd.health.nsw.gov.au", title: "Western Sydney Local Health District (Westmead Hospital)" },
  { url: "https://www.alfred.org.au", title: "The Alfred Hospital, Melbourne" },
  { url: "https://www.monashhealth.org", title: "Monash Health" },
  { url: "https://www.svhm.org.au", title: "St Vincent's Hospital Melbourne" },
  { url: "https://www.calvarycare.com.au", title: "Calvary Health Care" },
  { url: "https://www.epworth.org.au", title: "Epworth HealthCare" },
  { url: "https://www.petermac.org", title: "Peter MacCallum Cancer Centre" },

  // State & Territory Health Departments (new sub-sites)
  { url: "https://www.health.nsw.gov.au", title: "NSW Health" },
  { url: "https://www.health.qld.gov.au", title: "Queensland Health" },
  { url: "https://www.health.vic.gov.au", title: "Victoria Department of Health" },
  { url: "https://www.sahealth.sa.gov.au", title: "SA Health (South Australia)" },
  { url: "https://www.health.wa.gov.au", title: "Western Australia Department of Health" },
  { url: "https://www.health.act.gov.au", title: "ACT Health" },
  { url: "https://www.health.tas.gov.au", title: "Tasmanian Department of Health" },

  // Research Institutes & Funding Bodies
  { url: "https://www.nhmrc.gov.au", title: "National Health and Medical Research Council (NHMRC)" },
  { url: "https://www.arc.gov.au", title: "Australian Research Council" },
  { url: "https://www.garvan.org.au", title: "Garvan Institute of Medical Research" },
  { url: "https://www.wehi.edu.au", title: "Walter and Eliza Hall Institute (WEHI)" },
  { url: "https://www.baker.edu.au", title: "Baker Heart and Diabetes Institute" },
  { url: "https://www.qimrberghofer.edu.au", title: "QIMR Berghofer Medical Research Institute" },
  { url: "https://www.mcri.edu.au", title: "Murdoch Children's Research Institute" },
  { url: "https://www.georgeinstitute.org.au", title: "The George Institute for Global Health" },
  { url: "https://www.menzies.edu.au", title: "Menzies School of Health Research" },

  // Disease-Specific Organisations & Foundations
  { url: "https://www.cancer.org.au", title: "Cancer Council Australia" },
  { url: "https://www.heartfoundation.org.au", title: "Heart Foundation" },
  { url: "https://www.diabetesaustralia.com.au", title: "Diabetes Australia" },
  { url: "https://www.alzheimers.org.au", title: "Dementia Australia" },
  { url: "https://www.arthritis.org.au", title: "Arthritis Australia" },
  { url: "https://www.lungfoundation.com.au", title: "Lung Foundation Australia" },
  { url: "https://www.mnd.org.au", title: "Motor Neurone Disease Australia" },
  { url: "https://www.stroke.org.au", title: "Stroke Foundation" },
  { url: "https://www.beyondblue.org.au", title: "Beyond Blue (Mental Health)" },
  { url: "https://www.headspace.org.au", title: "headspace (Youth Mental Health)" },
  { url: "https://www.blackdoginstitute.org.au", title: "Black Dog Institute" },

  // Professional Medical Associations
  { url: "https://www.ama.com.au", title: "Australian Medical Association (AMA)" },
  { url: "https://www.racgp.org.au", title: "Royal Australian College of General Practitioners (RACGP)" },
  { url: "https://www.ranzcog.edu.au", title: "Royal Australian and New Zealand College of Obstetricians and Gynaecologists (RANZCOG)" },
  { url: "https://www.ranzcp.org", title: "Royal Australian and New Zealand College of Psychiatrists (RANZCP)" },
  { url: "https://www.apna.asn.au", title: "Australian Primary Health Care Nurses Association (APNA)" },
  { url: "https://www.psa.org.au", title: "Pharmaceutical Society of Australia (PSA)" },

  // Regulatory, Accreditation & Oversight
  { url: "https://www.ahpra.gov.au", title: "Australian Health Practitioner Regulation Agency (Ahpra)" },

  // Medical Journals & Research Databases (Australian)
  { url: "https://www.mja.com.au", title: "Medical Journal of Australia (MJA)" },
  { url: "https://www.anzjog.com", title: "Australian and New Zealand Journal of Obstetrics and Gynaecology (ANZJOG)" },
  { url: "https://www.internalmedicinejournal.com", title: "Internal Medicine Journal" },

  // Consumer Health & Education Portals
  { url: "https://www.mydr.com.au", title: "myDr.com.au" },
  { url: "https://www.raisingchildren.net.au", title: "Raising Children Network" },
  { url: "https://www.pregnancybirthbaby.org.au", title: "Pregnancy, Birth and Baby" },

  // Additional Specialised Resources
  { url: "https://www.pbs.gov.au", title: "Pharmaceutical Benefits Scheme (PBS)" },
  { url: "https://www.healthinfonet.ecu.edu.au", title: "Australian Indigenous HealthInfoNet" },

    // Japan – Health & Medical (new)
  // National Agencies & Research Institutes
  { url: "https://www.niph.go.jp", title: "National Institute of Public Health (NIPH)" },
  { url: "https://www.pmda.go.jp", title: "Pharmaceuticals and Medical Devices Agency (PMDA)" },
  { url: "https://www.niid.go.jp", title: "National Institute of Infectious Diseases (NIID)" },
  { url: "https://www.jstd.or.jp", title: "Japan Society of Transfusion Medicine and Cell Therapy" },

  // Major Hospitals & Medical Centres
  { url: "https://www.ncchd.go.jp", title: "National Center for Child Health and Development (NCCHD)" },
  { url: "https://www.ncc.go.jp", title: "National Cancer Center Japan" },
  { url: "https://www.ncvc.go.jp", title: "National Cerebral and Cardiovascular Center (NCVC)" },
  { url: "https://www.nims.go.jp", title: "National Institute for Materials Science (medical applications)" },
  { url: "https://www.tokyo-med.ac.jp", title: "Tokyo Medical University Hospital" },
  { url: "https://www.med.juntendo.ac.jp", title: "Juntendo University Hospital" },
  { url: "https://www.h.u-tokyo.ac.jp", title: "University of Tokyo Hospital" },
  { url: "https://www.keio.ac.jp", title: "Keio University Hospital (Keio University)" },
  { url: "https://www.osaka-u.ac.jp", title: "Osaka University Hospital (Osaka University)" },
  { url: "https://www.kyoto-u.ac.jp", title: "Kyoto University Hospital (Kyoto University)" },
  { url: "https://www.nagoya-u.ac.jp", title: "Nagoya University Hospital (Nagoya University)" },
  { url: "https://www.tohoku.ac.jp", title: "Tohoku University Hospital (Tohoku University)" },
  { url: "https://www.sapporo-med.ac.jp", title: "Sapporo Medical University Hospital" },
  { url: "https://www.stlukes.or.jp", title: "St. Luke’s International Hospital" },
  { url: "https://www.toranomon.gr.jp", title: "Toranomon Hospital" },
  { url: "https://www.kameda.com", title: "Kameda Medical Center" },

  // Research Institutes & Funding
  { url: "https://www.riken.jp", title: "RIKEN (multi‑disciplinary research, including medical)" },
  { url: "https://www.amed.go.jp", title: "Japan Agency for Medical Research and Development (AMED)" },
  { url: "https://www.jst.go.jp", title: "Japan Science and Technology Agency (JST)" },
  { url: "https://www.jsps.go.jp", title: "Japan Society for the Promotion of Science (JSPS)" },
  { url: "https://www.ncgm.go.jp", title: "National Center for Global Health and Medicine (NCGM)" },

  // Disease‑Specific Organizations
  { url: "https://www.ganjoho.jp", title: "National Cancer Information Center (Ganjoho)" },
  { url: "https://www.j-circ.or.jp", title: "Japanese Circulation Society" },
  { url: "https://www.diabetes-japan.jp", title: "Japan Diabetes Society" },
  { url: "https://www.alz.or.jp", title: "Japan Alzheimer’s Association" },
  { url: "https://www.jhf.or.jp", title: "Japan Heart Foundation" },

  // Professional Medical Associations
  { url: "https://www.med.or.jp", title: "Japan Medical Association" },
  { url: "https://www.jssr.or.jp", title: "Japan Surgical Society" },
  { url: "https://www.jpeds.or.jp", title: "Japan Pediatric Society" },
  { url: "https://www.jsog.or.jp", title: "Japan Society of Obstetrics and Gynecology" },
  { url: "https://www.jns.or.jp", title: "Japanese Neurological Society" },
  { url: "https://www.jgca.jp", title: "Japanese Gastric Cancer Association" },

  // Regulatory & Quality
  { url: "https://www.jcqhc.or.jp", title: "Japan Council for Quality Health Care (JCQHC)" },

  // Medical Journals & Databases (Japan‑specific)
  { url: "https://www.jstage.jst.go.jp", title: "J‑STAGE (Japan Science and Technology Information Aggregator)" },
  { url: "https://www.jmedj.jp", title: "Japan Medical Journal" },

  // Consumer Health & Information
  { url: "https://www.e-healthnet.mhlw.go.jp", title: "e‑Health Net (MHLW public information)" },
  { url: "https://www.kenkouippon.jp", title: "Health Promotion (Kenkou Ippon)" },

    // Global Health – New Sources
  { url: "https://www.who.int", title: "World Health Organization (WHO)" },
  { url: "https://www.unaids.org", title: "UNAIDS (Joint United Nations Programme on HIV/AIDS)" },
  { url: "https://www.unfpa.org", title: "United Nations Population Fund (UNFPA)" },
  { url: "https://www.unwomen.org", title: "UN Women (Health & Gender)" },
  { url: "https://www.iaea.org", title: "International Atomic Energy Agency (IAEA) – Medical Applications" },
  { url: "https://ourworldindata.org/health", title: "Our World in Data – Health" },
  { url: "https://www.gavi.org", title: "Gavi, the Vaccine Alliance" },
  { url: "https://www.theglobalfund.org", title: "The Global Fund to Fight AIDS, Tuberculosis and Malaria" },
  { url: "https://www.ghsi.org", title: "Global Health Security Initiative (GHSI)" },
  { url: "https://www.gatesfoundation.org", title: "Bill & Melinda Gates Foundation" },
  { url: "https://www.doctorswithoutborders.org", title: "Médecins Sans Frontières (Doctors Without Borders)" },
  { url: "https://www.redcross.org", title: "International Red Cross" },
  { url: "https://www.icrc.org", title: "International Committee of the Red Cross (ICRC)" },
  { url: "https://www.oxfam.org", title: "Oxfam International (Health & Humanitarian)" },
  { url: "https://www.care.org", title: "CARE International" },
  { url: "https://www.worldvision.org", title: "World Vision (Health Initiatives)" },
  { url: "https://www.iapb.org", title: "International Agency for the Prevention of Blindness (IAPB)" },
  { url: "https://www.iccidd.org", title: "International Council for Control of Iodine Deficiency Disorders (ICCIDD)" },
  { url: "https://www.ifrc.org", title: "International Federation of Red Cross and Red Crescent Societies (IFRC)" },
  { url: "https://www.isglobal.org", title: "Barcelona Institute for Global Health (ISGlobal)" },
  { url: "https://www.lshtm.ac.uk", title: "London School of Hygiene & Tropical Medicine (LSHTM)" },
  { url: "https://www.ich.org", title: "International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use (ICH)" },
  { url: "https://www.iso.org", title: "International Organization for Standardization (ISO) – Health Standards" },
  { url: "https://www.fdiworlddental.org", title: "FDI World Dental Federation" },
  { url: "https://www.wma.net", title: "World Medical Association (WMA)" },
  { url: "https://www.healthdata.org", title: "Institute for Health Metrics and Evaluation (IHME)" },
  { url: "https://www.malariaconsortium.org", title: "Malaria Consortium" },
  { url: "https://www.tballiance.org", title: "TB Alliance" },
  { url: "https://www.drugsformeglobalhealth.org", title: "Drugs for Neglected Diseases initiative (DNDi)" },
  { url: "https://www.clintonhealthaccess.org", title: "Clinton Health Access Initiative (CHAI)" },
  { url: "https://www.path.org", title: "PATH (Global Health Innovation)" },

    // China – Health & Medical (new)
  { url: "https://www.nhc.gov.cn", title: "National Health Commission" },
  { url: "https://www.chinacdc.cn", title: "Chinese Center for Disease Control and Prevention (China CDC)" },
  { url: "https://www.nmpa.gov.cn", title: "National Medical Products Administration (NMPA)" },
  { url: "https://www.moh.gov.cn", title: "Ministry of Health (legacy)" },
  { url: "https://www.pumch.cn", title: "Peking Union Medical College Hospital" },
  { url: "https://www.bjmu.edu.cn", title: "Peking University Health Science Center" },
  { url: "https://www.zju.edu.cn", title: "Zhejiang University (medical centers)" },
  { url: "https://www.ruijin.com.cn", title: "Ruijin Hospital, Shanghai Jiao Tong University School of Medicine" },
  { url: "https://www.fudan.edu.cn", title: "Fudan University Shanghai Medical College" },
  { url: "https://www.sjtu.edu.cn", title: "Shanghai Jiao Tong University School of Medicine" },
  { url: "https://www.xinhuahospital.com.cn", title: "Xinhua Hospital (Shanghai Jiao Tong University)" },
  { url: "https://www.westchinahospital.cn", title: "West China Hospital, Sichuan University" },
  { url: "https://www.tjmuch.com", title: "Tianjin Medical University General Hospital" },
  { url: "https://www.csu.edu.cn", title: "Central South University Xiangya Hospital" },
  { url: "https://www.syshospital.com", title: "Sun Yat-sen University Hospitals" },
  { url: "https://www.jlu.edu.cn", title: "Jilin University (medical center)" },
  { url: "https://www.ahmu.edu.cn", title: "Anhui Medical University" },
  { url: "https://www.cas.cn", title: "Chinese Academy of Sciences (medical institutes)" },
  { url: "https://www.cams.cn", title: "Chinese Academy of Medical Sciences (CAMS)" },
  { url: "https://www.nsfc.gov.cn", title: "National Natural Science Foundation of China" },
  { url: "https://www.most.gov.cn", title: "Ministry of Science and Technology" },
  { url: "https://www.cnki.net", title: "China National Knowledge Infrastructure (CNKI)" },
  { url: "https://www.cncbd.org.cn", title: "China National Center for Biotechnology Development" },
  { url: "https://www.nationalcancercenter.org.cn", title: "National Cancer Center of China" },
  { url: "https://www.ccdc.org.cn", title: "Chinese Center for Disease Control and Prevention (specialized)" },
  { url: "https://www.cmda.net.cn", title: "Chinese Medical Doctor Association" },
  { url: "https://www.cma.org.cn", title: "Chinese Medical Association" },
  { url: "https://www.csbms.org.cn", title: "Chinese Society of Biomedical Engineering" },
  { url: "https://www.cacms.org.cn", title: "China Association of Chinese Medicine (TCM)" },
  { url: "https://www.cmj.org", title: "Chinese Medical Journal" },
  { url: "https://www.satcm.gov.cn", title: "State Administration of Traditional Chinese Medicine" },
  { url: "https://www.wfcms.org", title: "World Federation of Chinese Medicine Societies" },
  { url: "https://www.tcmchina.org.cn", title: "Traditional Chinese Medicine (TCM China)" },
  { url: "https://www.china.org.cn", title: "China.org.cn – Health Sections" },
  { url: "https://www.english.nmpa.gov.cn", title: "NMPA English Portal" },

    // South Korea – Health & Medical (new)
  // National Agencies (new)
  { url: "https://www.mfds.go.kr", title: "Ministry of Food and Drug Safety (MFDS)" },
  { url: "https://www.nhis.or.kr", title: "National Health Insurance Service (NHIS)" },

  // Major Hospitals & Medical Centres
  { url: "https://www.samsunghospital.com", title: "Samsung Medical Center" },
  { url: "https://www.severance.hs.or.kr", title: "Severance Hospital (Yonsei University)" },
  { url: "https://www.seoulnationalunivhospital.org", title: "Seoul National University Hospital" },
  { url: "https://www.amc.seoul.kr", title: "Asan Medical Center" },
  { url: "https://www.snubh.org", title: "Seoul National University Bundang Hospital" },
  { url: "https://www.catholic.ac.kr", title: "Catholic University of Korea Hospitals" },
  { url: "https://www.kbsmc.or.kr", title: "Kangbuk Samsung Hospital" },
  { url: "https://www.kuh.ac.kr", title: "Korea University Hospital" },
  { url: "https://www.hanyang.ac.kr", title: "Hanyang University Hospital" },

  // Research Institutes & Funding
  { url: "https://www.kahp.or.kr", title: "Korea Academy of Health Policy" },
  { url: "https://www.kiom.re.kr", title: "Korea Institute of Oriental Medicine (KIOM)" },
  { url: "https://www.kribb.re.kr", title: "Korea Research Institute of Bioscience and Biotechnology (KRIBB)" },
  { url: "https://www.kist.re.kr", title: "Korea Institute of Science and Technology (KIST)" },
  { url: "https://www.nrf.re.kr", title: "National Research Foundation of Korea (NRF)" },

  // Disease‑Specific & Professional Associations
  { url: "https://www.kams.or.kr", title: "Korean Academy of Medical Sciences" },
  { url: "https://www.kaoms.or.kr", title: "Korean Association of Oral and Maxillofacial Surgeons" },
  { url: "https://www.koreanheart.or.kr", title: "Korean Heart Foundation" },
  { url: "https://www.cancer.go.kr", title: "National Cancer Center Korea" },
  { url: "https://www.diabetes.or.kr", title: "Korean Diabetes Association" },

  // DPRK & Global Health Resources (new)
  { url: "https://www.reliefweb.int", title: "ReliefWeb (humanitarian health reports)" },
  { url: "https://www.dprkhealth.org", title: "DPRK Health (NGO / research)" },
  { url: "https://www.kcna.kp", title: "Korean Central News Agency – Health (limited credibility)" },
  { url: "https://www.fao.org", title: "Food and Agriculture Organization (FAO) – Nutrition & Health Reports" },

    // France – Health & Medical (new)
  // National Government & Agencies
  { url: "https://www.sante.gouv.fr", title: "Ministry of Health and Prevention" },
  { url: "https://www.has-sante.fr", title: "Haute Autorité de Santé (HAS)" },
  { url: "https://ansm.sante.fr", title: "Agence nationale de sécurité du médicament et des produits de santé (ANSM)" },
  { url: "https://www.santepubliquefrance.fr", title: "Santé publique France (Public Health Agency)" },
  { url: "https://www.data.gouv.fr", title: "Open Health Data – data.gouv.fr" },

  // Major Hospitals & University Medical Centres
  { url: "https://www.aphp.fr", title: "Assistance Publique – Hôpitaux de Paris (AP-HP)" },
  { url: "https://www.chu-toulouse.fr", title: "CHU de Toulouse" },
  { url: "https://www.chu-lyon.fr", title: "Hospices Civils de Lyon" },
  { url: "https://www.chu-marseille.fr", title: "Assistance Publique – Hôpitaux de Marseille" },
  { url: "https://www.chu-bordeaux.fr", title: "CHU de Bordeaux" },
  { url: "https://www.chu-nantes.fr", title: "CHU de Nantes" },
  { url: "https://www.chu-rennes.fr", title: "CHU de Rennes" },
  { url: "https://www.chu-strasbourg.fr", title: "CHU de Strasbourg" },
  { url: "https://www.gustaveroussy.fr", title: "Gustave Roussy (cancer center)" },
  { url: "https://www.institut-curie.org", title: "Institut Curie" },

  // Research Institutes & Funding Bodies
  { url: "https://www.inserm.fr", title: "Institut National de la Santé et de la Recherche Médicale (INSERM)" },
  { url: "https://www.cnrs.fr", title: "Centre National de la Recherche Scientifique (CNRS) – Health" },
  { url: "https://www.pasteur.fr", title: "Institut Pasteur" },
  { url: "https://www.cea.fr", title: "Commissariat à l’énergie atomique et aux énergies alternatives (CEA) – Medical" },
  { url: "https://www.inria.fr", title: "Institut national de recherche en sciences et technologies du numérique (INRIA) – Digital Health" },
  { url: "https://www.fondation-arc.org", title: "Fondation ARC pour la recherche sur le cancer" },
  { url: "https://www.frm.org", title: "Fondation pour la Recherche Médicale" },

  // Disease-Specific Organizations
  { url: "https://www.ligue-cancer.net", title: "Ligue contre le cancer" },
  { url: "https://www.afm-telethon.fr", title: "AFM-Téléthon (muscular dystrophy)" },
  { url: "https://www.francealzheimer.org", title: "France Alzheimer" },
  { url: "https://www.sidaction.org", title: "Sidaction (HIV)" },
  { url: "https://www.apf.asso.fr", title: "APF France handicap (disability & health)" },
  { url: "https://www.coeur.org", title: "Fédération Française de Cardiologie" },

  // Professional Medical Associations
  { url: "https://www.conseil-national.medecin.fr", title: "Ordre National des Médecins" },
  { url: "https://www.sfmg.org", title: "Société Française de Médecine Générale" },
  { url: "https://www.snfmi.org", title: "Société Nationale Française de Médecine Interne" },
  { url: "https://www.sfrnet.org", title: "Société Française de Radiologie" },
  { url: "https://www.sfar.org", title: "Société Française d’Anesthésie et de Réanimation" },

  // Regulatory & Quality Bodies (new) – already listed HAS & ANSM, adding just the variant
  { url: "https://www.hauteautorite-sante.fr", title: "Haute Autorité de Santé (alternative domain)" },

  // Medical Journals & Research (new French-specific)
  { url: "https://www.presse.inserm.fr", title: "Inserm Press / Research Highlights" },
  { url: "https://www.em-consulte.com", title: "EM Consulte (French medical journals)" },

  // Consumer Health & Information Portals (new)
  { url: "https://www.pharmacie.fr", title: "Ordre National des Pharmaciens – Pharmacie.fr" },

  // Additional Specialized Resources
  { url: "https://drees.solidarites-sante.gouv.fr", title: "Direction de la Recherche, des Études, de l’Évaluation et des Statistiques (DREES) – Health Statistics" },
  { url: "https://www.ephmra.org", title: "European Pharmaceutical Market Research Association (EphMRA) – Health Data" },

    // Italy – Health & Medical (new)
  // National Government & Agencies
  { url: "https://www.salute.gov.it", title: "Ministero della Salute (Ministry of Health)" },
  { url: "https://www.iss.it", title: "Istituto Superiore di Sanità (ISS)" },
  { url: "https://www.aifa.gov.it", title: "Agenzia Italiana del Farmaco (AIFA)" },
  { url: "https://www.agenziasanita.toscana.it", title: "Agenzia Regionale di Sanità della Toscana" },
  { url: "https://www.dati.gov.it", title: "Open Health Data – dati.gov.it" },

  // Major Hospitals & Research Hospitals
  { url: "https://www.ospedalebambinogesu.it", title: "Ospedale Pediatrico Bambino Gesù (Rome)" },
  { url: "https://www.policlinico.unimi.it", title: "Policlinico di Milano" },
  { url: "https://www.sanraffaele.org", title: "IRCCS Ospedale San Raffaele (Milan)" },
  { url: "https://www.humanitas.it", title: "Humanitas Research Hospital" },
  { url: "https://www.policlinicogemelli.it", title: "Policlinico Gemelli (Rome)" },
  { url: "https://www.ao-san-camillo.it", title: "Azienda Ospedaliera San Camillo-Forlanini (Rome)" },
  { url: "https://www.irccs.it", title: "IRCCS Research Hospitals Network" },
  { url: "https://www.ospedale.niguarda.it", title: "Ospedale Niguarda Ca' Granda (Milan)" },
  { url: "https://www.careggi.it", title: "Azienda Ospedaliero-Universitaria Careggi (Florence)" },
  { url: "https://www.policlinico.sanmartino.it", title: "Policlinico San Martino (Genoa)" },
  { url: "https://www.ao-pisa.it", title: "Azienda Ospedaliero-Universitaria Pisana" },

  // Research Institutes & Funding Bodies
  { url: "https://www.cnr.it", title: "Consiglio Nazionale delle Ricerche (CNR) – health sections" },
  { url: "https://www.telethon.it", title: "Fondazione Telethon (genetic diseases)" },
  { url: "https://www.airc.it", title: "Associazione Italiana per la Ricerca sul Cancro (AIRC)" },
  { url: "https://www.gimbe.org", title: "GIMBE (Evidence-Based Medicine)" },
  { url: "https://www.fondazioneveronesi.it", title: "Fondazione Veronesi (cancer & health research)" },

  // Disease-Specific Organizations
  { url: "https://www.alzheimer.it", title: "Federazione Alzheimer Italia" },
  { url: "https://www.anlaids.it", title: "ANLAIDS – Lotta contro l'AIDS" },
  { url: "https://www.cuore.it", title: "Fondazione Italiana per il Cuore (Italian Heart Foundation)" },

  // Professional Medical Associations
  { url: "https://www.fnomceo.it", title: "FNOMCeO (Federazione Nazionale degli Ordini dei Medici)" },
  { url: "https://www.simg.it", title: "Società Italiana di Medicina Generale (SIMG)" },
  { url: "https://www.sip.it", title: "Società Italiana di Pediatria (SIP)" },
  { url: "https://www.siia.it", title: "Società Italiana di Medicina Interna (SIIA)" },
  { url: "https://www.sirm.org", title: "Società Italiana di Radiologia Medica e Interventistica (SIRM)" },

  // Regulatory & Quality Bodies
  { url: "https://www.agenas.it", title: "Agenzia Nazionale per i Servizi Sanitari Regionali (AGENAS)" },

  // Regional Health Systems (key examples)
  { url: "https://www.regione.lombardia.it/sanita", title: "Regione Lombardia – Sanità" },
  { url: "https://www.regione.toscana.it/salute", title: "Regione Toscana – Salute" },
  { url: "https://www.regione.emilia-romagna.it/sanita", title: "Regione Emilia-Romagna – Sanità" },
  { url: "https://www.regione.lazio.it/salute", title: "Regione Lazio – Salute" },
  { url: "https://www.regione.veneto.it/sanita", title: "Regione Veneto – Sanità" },

    // Mexico – Health & Medical (new)
  // Federal Government & Agencies
  { url: "https://www.salud.gob.mx", title: "Secretaría de Salud (Main Health Ministry)" },
  { url: "https://www.gob.mx/salud", title: "Government of Mexico – Health Portal" },
  { url: "https://www.cndh.org.mx", title: "Comisión Nacional de los Derechos Humanos (Health Focus)" },
  { url: "https://www.insp.mx", title: "Instituto Nacional de Salud Pública (INSP)" },
  { url: "https://www.cofepris.gob.mx", title: "COFEPRIS (Federal Commission for the Protection against Sanitary Risk)" },
  { url: "https://www.imss.gob.mx", title: "Instituto Mexicano del Seguro Social (IMSS)" },
  { url: "https://www.issste.gob.mx", title: "ISSSTE (Institute for Social Security and Services for State Workers)" },
  { url: "https://www.ssa.gob.mx", title: "Secretaría de Salud (legacy domain)" },

  // Major Hospitals & Medical Centres
  { url: "https://www.incmnsz.mx", title: "Instituto Nacional de Ciencias Médicas y Nutrición Salvador Zubirán" },
  { url: "https://www.cardiologia.org.mx", title: "Instituto Nacional de Cardiología Ignacio Chávez" },
  { url: "https://www.inper.mx", title: "Instituto Nacional de Perinatología" },
  { url: "https://www.pediatria.gob.mx", title: "Instituto Nacional de Pediatría" },
  { url: "https://www.hospitalinfantil.org.mx", title: "Hospital Infantil de México Federico Gómez" },
  { url: "https://www.anahuac.mx", title: "Universidad Anáhuac – Medical Centers" },
  { url: "https://tecsalud.tec.mx", title: "TecSalud (Tecnológico de Monterrey Health System)" },
  { url: "https://www.abcmedicalcenter.com", title: "ABC Medical Center" },
  { url: "https://www.starmedicagroup.com", title: "Star Médica Group" },

  // Research Institutes & Higher Education
  { url: "https://www.cinvestav.mx", title: "CINVESTAV (Centro de Investigación y de Estudios Avanzados)" },
  { url: "https://www.unam.mx", title: "Universidad Nacional Autónoma de México (UNAM) – Faculty of Medicine" },
  { url: "https://www.ipn.mx", title: "Instituto Politécnico Nacional (IPN) – Health Programs" },
  { url: "https://www.conahcyt.mx", title: "Conahcyt (National Council of Humanities, Science and Technology)" },

  // Disease-Specific Programs & Foundations
  { url: "https://www.fmdiabetes.org", title: "Fundación Mexicana para la Diabetes" },
  //  (cardiovascular and cancer foundations: corazon.org.mx not available, cancer org not listed; skip generic)

  // Professional Medical Associations
  { url: "https://www.cmm.org.mx", title: "Colegio Médico de México" },
  { url: "https://www.amfm.org.mx", title: "Asociación Mexicana de Facultades y Escuelas de Medicina" },
  { url: "https://www.acmx.org.mx", title: "Academia Nacional de Medicina de México" },
  { url: "https://www.federacionmedica.org.mx", title: "Federación Médica de la República Mexicana" },

  // Medical Journals & Research
  { url: "https://www.saludpublica.mx", title: "Revista de Salud Pública de México" },

  // State Health Services (key examples)
  { url: "https://www.salud.df.gob.mx", title: "Secretaría de Salud de la Ciudad de México (CDMX)" },
  { url: "https://www.jalisco.gob.mx/salud", title: "Salud Jalisco" },
  { url: "https://www.nuevoleon.gob.mx/salud", title: "Salud Nuevo León" },
  { url: "https://www.yucatan.gob.mx/salud", title: "Salud Yucatán" },

  // International / Pan-American
  { url: "https://www.paho.org", title: "Pan American Health Organization (PAHO/WHO Regional Office)" },

    // Spain – Health & Medical (new)
  // National Government & Agencies
  { url: "https://www.sanidad.gob.es", title: "Ministerio de Sanidad (Ministry of Health)" },
  { url: "https://www.mscbs.gob.es", title: "Ministerio de Sanidad, Consumo y Bienestar Social (legacy)" },
  { url: "https://www.aemps.gob.es", title: "Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)" },
  { url: "https://www.isciii.es", title: "Instituto de Salud Carlos III (ISCIII)" },

  // Major Hospitals & Research Hospitals
  { url: "https://www.hospitalclinic.org", title: "Hospital Clínic de Barcelona" },
  { url: "https://www.parcdesalutmar.cat", title: "Parc de Salut Mar (Hospital del Mar)" },
  { url: "https://www.vallhebron.com", title: "Hospital Universitari Vall d'Hebron" },
  { url: "https://www.comunidad.madrid/hospital/gregoriomaranon", title: "Hospital General Universitario Gregorio Marañón" },
  { url: "https://www.comunidad.madrid/hospital/12octubre", title: "Hospital Universitario 12 de Octubre" },
  { url: "https://www.comunidad.madrid/hospital/ramonycajal", title: "Hospital Universitario Ramón y Cajal" },
  { url: "https://www.comunidad.madrid/hospital/clinicosancarlos", title: "Hospital Clínico San Carlos" },
  { url: "https://www.lafe.es", title: "Hospital Universitari i Politècnic La Fe" },
  { url: "https://www.hospitaluvrocio.es", title: "Hospital Universitario Virgen del Rocío" },
  { url: "https://www.hospitalcruces.com", title: "Hospital Universitario Cruces (Osakidetza)" },

  // Research Institutes & Funding Bodies
  { url: "https://www.csic.es", title: "Consejo Superior de Investigaciones Científicas (CSIC)" },
  { url: "https://www.cnio.es", title: "Centro Nacional de Investigaciones Oncológicas (CNIO)" },
  { url: "https://www.cnic.es", title: "Centro Nacional de Investigaciones Cardiovasculares (CNIC)" },
  { url: "https://www.idibaps.org", title: "Institut d'Investigacions Biomèdiques August Pi i Sunyer (IDIBAPS)" },
  { url: "https://www.vhio.net", title: "Vall d’Hebron Institute of Oncology (VHIO)" },
  { url: "https://www.ciberisciii.es", title: "CIBER (Centro de Investigación Biomédica en Red)" },

  // Disease-Specific Organizations
  { url: "https://www.aecc.es", title: "Asociación Española Contra el Cáncer (AECC)" },
  { url: "https://www.fundacioncontraelcancer.org", title: "Fundación Contra el Cáncer" },
  { url: "https://www.secardiologia.es", title: "Sociedad Española de Cardiología (SEC)" },

  // Professional Medical Associations
  { url: "https://www.cgcom.es", title: "Consejo General de Colegios Oficiales de Médicos (CGCOM)" },
  { url: "https://www.semfyc.es", title: "Sociedad Española de Medicina de Familia y Comunitaria (semFYC)" },
  { url: "https://www.sego.es", title: "Sociedad Española de Ginecología y Obstetricia (SEGO)" },
  { url: "https://www.aeped.es", title: "Asociación Española de Pediatría (AEP)" },
  { url: "https://www.semicyuc.org", title: "Sociedad Española de Medicina Intensiva, Crítica y Unidades Coronarias (SEMICYUC)" },

  // Medical Journals (Spanish-specific)
  { url: "https://www.elsevier.es", title: "Elsevier España (Revistas Médicas)" },
  { url: "https://www.revistaclinicaespanola.es", title: "Revista Clínica Española (RCE)" },
  { url: "https://www.medclin.es", title: "Medicina Clínica (journal)" },

  // Consumer Health & Information Portals
  { url: "https://www.salud2030.es", title: "Estrategia de Salud 2030 (National Health Strategy)" },

  // Regional Health Services (Key Autonomous Communities)
  { url: "https://catsalut.gencat.cat", title: "CatSalut (Servei Català de la Salut)" },
  { url: "https://www.comunidad.madrid/servicios/salud", title: "Servicio Madrileño de Salud (SERMAS)" },
  { url: "https://www.juntadeandalucia.es/salud", title: "Consejería de Salud y Consumo (Andalucía)" },
  { url: "https://www.osakidetza.euskadi.eus", title: "Osakidetza (Servicio Vasco de Salud)" },
  { url: "https://www.saludcastillayleon.es", title: "Sacyl (Sanidad de Castilla y León)" },

    // Switzerland – Health & Medical (new)
  // Federal Agencies & National Bodies
  { url: "https://www.bag.admin.ch", title: "Federal Office of Public Health (BAG / OFSP)" },
  { url: "https://www.admin.ch", title: "Federal Administration – Health (admin.ch)" },
  { url: "https://www.swissmedic.ch", title: "Swiss Agency for Therapeutic Products (Swissmedic)" },
  { url: "https://www.bfs.admin.ch", title: "Federal Statistical Office – Health Data" },
  { url: "https://www.samw.ch", title: "Swiss Academy of Medical Sciences (SAMW)" },
  { url: "https://www.kvg.org", title: "Health Insurance Oversight (KVG)" },

  // Major Hospitals & University Medical Centres
  { url: "https://www.usz.ch", title: "University Hospital Zurich (USZ)" },
  { url: "https://www.chuv.ch", title: "Lausanne University Hospital (CHUV)" },
  { url: "https://www.usb.ch", title: "University Hospital Basel (USB)" },
  { url: "https://www.insel.ch", title: "Inselspital Bern University Hospital" },
  { url: "https://www.balgrist.ch", title: "Balgrist University Hospital (Orthopaedics)" },
  { url: "https://www.kispi.uzh.ch", title: "University Children’s Hospital Zurich (Kinderspital)" },
  { url: "https://www.hirslanden.ch", title: "Hirslanden Private Hospital Group" },
  { url: "https://www.eoc.ch", title: "Ente Ospedaliero Cantonale (Ticino)" },

  // Research Institutes & Universities (health sciences)
  { url: "https://www.ethz.ch", title: "ETH Zurich (Health Sciences & Biomedical Engineering)" },
  { url: "https://www.unige.ch", title: "University of Geneva" },
  { url: "https://www.uzh.ch", title: "University of Zurich" },
  { url: "https://www.unibas.ch", title: "University of Basel" },
  { url: "https://www.snf.ch", title: "Swiss National Science Foundation (SNSF)" },
  { url: "https://www.sbfi.admin.ch", title: "State Secretariat for Education, Research and Innovation (SERI)" },
  // Pharma & global health (Swiss‑based)
  { url: "https://www.roche.com", title: "Roche (Swiss global pharma HQ)" },
  { url: "https://www.novartis.com", title: "Novartis (Swiss global pharma HQ)" },

  // Disease‑Specific Organizations & Foundations
  { url: "https://www.cancer.ch", title: "Swiss Cancer League (Krebsliga)" },
  { url: "https://www.swissheart.ch", title: "Swiss Heart Foundation" },
  { url: "https://www.diabetesgesellschaft.ch", title: "Swiss Diabetes Society" },
  { url: "https://www.alz.ch", title: "Alzheimer Switzerland" },
  { url: "https://www.lung.ch", title: "Swiss Lung League (Lungenliga)" },

  // Professional Medical Associations
  { url: "https://www.fmh.ch", title: "Swiss Medical Association (FMH)" },
  { url: "https://www.ssphplus.ch", title: "Swiss School of Public Health (SSPH+)" },
  { url: "https://www.sgim.ch", title: "Swiss Society of General Internal Medicine (SGIM)" },
  { url: "https://www.sgaim.ch", title: "Swiss Society of General Internal Medicine (SGAIM)" },

  // Quality & Accreditation
  { url: "https://www.anq.ch", title: "National Association for Quality Development in Hospitals (ANQ)" },

  // Medical Journals (Swiss‑focused)
  { url: "https://www.smw.ch", title: "Swiss Medical Weekly (SMW)" },
  { url: "https://www.ssmj.ch", title: "Swiss Medical Journal (SSMJ)" },

  // Consumer & Health Insurance Information
  { url: "https://www.gesundheit.ch", title: "Gesundheit.ch (Patient/health information)" },
  { url: "https://www.comparis.ch", title: "Comparis.ch (Health insurance comparison & info)" },

  // Cantonal Health Authorities (examples)
  { url: "https://www.zh.ch", title: "Canton Zurich – Health Department" },
  { url: "https://www.ge.ch", title: "Canton Geneva – Health Department" },

  // European Context
  { url: "https://www.ecdc.europa.eu", title: "European Centre for Disease Prevention and Control (ECDC)" },

    // Russia – Health & Medical (new)
  // National Government & Federal Agencies
  { url: "https://www.minzdrav.gov.ru", title: "Ministry of Health of the Russian Federation" },
  { url: "https://www.roszdravnadzor.gov.ru", title: "Federal Service for Surveillance in Healthcare (Roszdravnadzor)" },
  { url: "https://www.rospotrebnadzor.ru", title: "Federal Service for Surveillance on Consumer Rights Protection and Human Wellbeing (Rospotrebnadzor)" },
  { url: "https://www.fmbaros.ru", title: "Federal Medical-Biological Agency (FMBA)" },
  { url: "https://www.rosminzdrav.ru", title: "Ministry of Health (legacy/redirect)" },
  { url: "https://www.government.ru", title: "Government of Russia – Health Sections" },

  // Major Hospitals & Medical Research Centres
  { url: "https://www.nmicr.ru", title: "National Medical Research Centres (NMRC)" },
  { url: "https://www.nmrcr.ru", title: "National Medical Research Center of Oncology (N.N. Blokhin)" },
  { url: "https://www.bakulev.ru", title: "Bakulev Scientific Center for Cardiovascular Surgery" },
  { url: "https://www.nczd.ru", title: "National Medical Research Center for Children's Health (Pediatrics)" },
  { url: "https://www.almazovcentre.ru", title: "Almazov National Medical Research Centre" },
  { url: "https://www.sechenov.ru", title: "I.M. Sechenov First Moscow State Medical University" },
  { url: "https://www.msmu.ru", title: "Moscow State University of Medicine and Dentistry (MSUMD)" },

  // Research Institutes
  { url: "https://www.gamaleya.ru", title: "Gamaleya National Research Institute of Epidemiology and Microbiology" },
  { url: "https://www.vector.ru", title: "State Research Center of Virology and Biotechnology VECTOR" },

  // Professional Medical Associations
  { url: "https://www.nasci.ru", title: "National Association of Specialists in Infection Control (NASCI)" },
  { url: "https://www.rmass.ru", title: "Russian Medical Society (RMASS)" },

  // Medical Journals & Research Databases (Russian-specific)
  { url: "https://www.cyberleninka.ru", title: "CyberLeninka (Russian scientific library)" },
  { url: "https://www.elibrary.ru", title: "eLibrary.ru (Russian scientific publications)" },

  // Consumer & Public Information
  { url: "https://www.gosuslugi.ru", title: "State Services – Health Section (Gosuslugi)" },
  { url: "https://xn--80aesfpebagmfblc0a.xn--p1ai", title: "StopCoronavirus.rf (Official COVID‑19/Health Portal)" },

  // Additional Specialized Resource
  { url: "https://www.eurasiancommission.org", title: "Eurasian Economic Commission – Health Cooperation" },

    // Brazil – Health & Medical (new)
  // Federal Government & National Agencies
  { url: "https://www.saude.gov.br", title: "Ministério da Saúde (Ministry of Health)" },
  { url: "https://www.gov.br/saude", title: "Federal Government – Health (saúde.gov.br)" },
  { url: "https://www.fiocruz.br", title: "Fundação Oswaldo Cruz (Fiocruz – public health research)" },
  { url: "https://www.anvisa.gov.br", title: "Agência Nacional de Vigilância Sanitária (ANVISA)" },
  { url: "https://www.cns.gov.br", title: "Conselho Nacional de Saúde (National Health Council)" },
  { url: "https://www.datasus.gov.br", title: "DATASUS (Health Data and Informatics)" },
  { url: "https://www.bvs.br", title: "Biblioteca Virtual em Saúde (BVS)" },

  // Major Hospitals & Research Hospitals
  { url: "https://www.hc.fm.usp.br", title: "Hospital das Clínicas da USP (São Paulo)" },
  { url: "https://www.inca.gov.br", title: "Instituto Nacional de Câncer (INCA)" },
  { url: "https://www.incor.usp.br", title: "Instituto do Coração (InCor – Heart Institute)" },
  { url: "https://www.einstein.br", title: "Hospital Israelita Albert Einstein" },
  { url: "https://www.sirio-libanes.org.br", title: "Hospital Sírio-Libanês" },
  { url: "https://www.hcor.com.br", title: "Hospital do Coração (HCor)" },
  { url: "https://www.unicamp.br", title: "Universidade Estadual de Campinas (UNICAMP – Hospital de Clínicas)" },
  { url: "https://www.ufrj.br", title: "Universidade Federal do Rio de Janeiro (UFRJ – hospitals)" },
  { url: "https://www.ufmg.br", title: "Universidade Federal de Minas Gerais (UFMG – Hospital das Clínicas)" },

  // Research Institutes & Funding Bodies
  { url: "https://www.cnpq.br", title: "Conselho Nacional de Desenvolvimento Científico e Tecnológico (CNPq)" },
  { url: "https://www.fapesp.br", title: "Fundação de Amparo à Pesquisa do Estado de São Paulo (FAPESP)" },
  { url: "https://www.capes.gov.br", title: "Coordenação de Aperfeiçoamento de Pessoal de Nível Superior (CAPES)" },
  { url: "https://www.butantan.gov.br", title: "Instituto Butantan (vaccines & research)" },
  { url: "https://www.inct.gov.br", title: "Institutos Nacionais de Ciência e Tecnologia (INCT)" },

  // Disease-Specific Programs & Organizations
  { url: "https://www.aids.gov.br", title: "Departamento de HIV/Aids, Tuberculose, Hepatites Virais e Infecções Sexualmente Transmissíveis" },
  { url: "https://www.sociedadebrasileiradecardiologia.org.br", title: "Sociedade Brasileira de Cardiologia (SBC)" },

  // Professional Medical Associations
  { url: "https://www.amb.org.br", title: "Associação Médica Brasileira (AMB)" },
  { url: "https://www.cfm.org.br", title: "Conselho Federal de Medicina (CFM)" },
  { url: "https://www.sbim.org.br", title: "Sociedade Brasileira de Imunizações (SBIm)" },
  { url: "https://www.sbpc.org.br", title: "Sociedade Brasileira para o Progresso da Ciência (SBPC)" },

  // Regulatory Bodies
  { url: "https://www.ans.gov.br", title: "Agência Nacional de Saúde Suplementar (ANS)" },

  // Medical Journals & Databases
  { url: "https://www.scielo.br", title: "Scientific Electronic Library Online (SciELO – Brazil)" },

  // State Health Secretariats (key examples)
  { url: "https://www.saude.sp.gov.br", title: "Secretaria de Estado da Saúde de São Paulo" },
  { url: "https://www.saude.rs.gov.br", title: "Secretaria Estadual da Saúde do Rio Grande do Sul" },
  { url: "https://www.saude.rj.gov.br", title: "Secretaria de Estado de Saúde do Rio de Janeiro" },
  { url: "https://www.saude.mg.gov.br", title: "Secretaria de Estado de Saúde de Minas Gerais" },

    // Entertainment, Streaming, Music & Media (new)
  // Global Streaming Leaders
  { url: "https://www.netflix.com", title: "Netflix" },
  { url: "https://www.disneyplus.com", title: "Disney+" },
  { url: "https://www.hulu.com", title: "Hulu" },
  { url: "https://www.primevideo.com", title: "Amazon Prime Video" },
  { url: "https://www.hbomax.com", title: "HBO Max" },
  { url: "https://www.max.com", title: "Max (Warner Bros. Discovery)" },
  { url: "https://www.apple.com/apple-tv-plus", title: "Apple TV+" },
  { url: "https://www.paramountplus.com", title: "Paramount+" },
  { url: "https://www.peacocktv.com", title: "Peacock" },
  // Music Streaming (new beyond already‑listed Spotify, SoundCloud)
  { url: "https://www.pandora.com", title: "Pandora" },
  { url: "https://www.deezer.com", title: "Deezer" },
  { url: "https://www.tidal.com", title: "Tidal" },
  // Entertainment News & Trade Publications (new)
  { url: "https://www.variety.com", title: "Variety" },
  { url: "https://www.hollywoodreporter.com", title: "The Hollywood Reporter" },
  { url: "https://www.billboard.com", title: "Billboard" },
  { url: "https://www.rollingstone.com", title: "Rolling Stone" },
  { url: "https://www.ew.com", title: "Entertainment Weekly (EW)" },
  { url: "https://www.vulture.com", title: "Vulture (New York Magazine)" },
  { url: "https://www.deadline.com", title: "Deadline" },
  { url: "https://www.tmz.com", title: "TMZ" },
  // United Kingdom / Europe – Broadcaster Streamers & Portals
  { url: "https://www.bbc.co.uk/iplayer", title: "BBC iPlayer" },
  { url: "https://www.itv.com", title: "ITV (ITVX)" },
  { url: "https://www.channel4.com", title: "Channel 4 (All 4)" },
  { url: "https://www.sky.com", title: "Sky" },
  { url: "https://www.nowtv.com", title: "NOW (Sky)" },
  { url: "https://www.my5.tv", title: "My5 (Channel 5)" },
  { url: "https://www.france.tv", title: "France.tv" },
  { url: "https://www.mycanal.fr", title: "Canal+ (myCANAL)" },
  { url: "https://www.zdf.de", title: "ZDF Mediathek" },
  { url: "https://www.ardmediathek.de", title: "ARD Mediathek" },
  { url: "https://www.joyn.de", title: "Joyn (Germany)" },
  { url: "https://www.rtve.es", title: "RTVE Play (Spain)" },
  { url: "https://www.atresplayer.com", title: "Atresplayer (Spain)" },
  { url: "https://www.movistarplus.es", title: "Movistar+ (Spain)" },
  // India – Streaming & Music
  { url: "https://www.hotstar.com", title: "Disney+ Hotstar" },
  { url: "https://www.jiocinema.com", title: "JioCinema" },
  { url: "https://www.sonyliv.com", title: "Sony LIV" },
  { url: "https://www.zee5.com", title: "ZEE5" },
  { url: "https://www.jiosaavn.com", title: "JioSaavn" },
  { url: "https://www.gaana.com", title: "Gaana" },
  { url: "https://www.erosnow.com", title: "Eros Now" },
  { url: "https://www.mxplayer.com", title: "MX Player" },
  // China – Streaming & Music Platforms
  { url: "https://www.youku.com", title: "Youku (Alibaba)" },
  { url: "https://www.iqiyi.com", title: "iQiyi" },
  { url: "https://v.qq.com", title: "Tencent Video" },
  { url: "https://www.mango.com", title: "Mango TV" },
  { url: "https://www.pptv.com", title: "PPTV" },
  { url: "https://music.163.com", title: "NetEase Cloud Music" },
  { url: "https://y.qq.com", title: "QQ Music (Tencent)" },
  // Brazil / Latin America
  { url: "https://globoplay.globo.com", title: "Globoplay" },
  // South Korea – Music & Streaming
  { url: "https://www.melon.com", title: "Melon (Music)" },
  { url: "https://www.genie.co.kr", title: "Genie Music" },
  { url: "https://www.tving.com", title: "TVING" },
  { url: "https://www.wavve.com", title: "Wavve" },
  { url: "https://www.weverse.io", title: "Weverse (K‑pop community)" },
  // Japan – Entertainment Platforms
  { url: "https://www.nicovideo.jp", title: "Niconico Douga" },
  { url: "https://www.dmm.com", title: "DMM" },
  { url: "https://www.nhk.or.jp", title: "NHK (Japan Broadcasting)" },
  // Russia – Entertainment
  { url: "https://www.vk.com", title: "VK (Entertainment)" },
  { url: "https://www.rutube.ru", title: "Rutube" },
  { url: "https://www.kinopoisk.ru", title: "Kinopoisk (Yandex)" },
  // Australia – Local Streaming
  { url: "https://www.stan.com.au", title: "Stan" },
  { url: "https://www.binge.com.au", title: "Binge" },
  { url: "https://www.foxtel.com.au", title: "Foxtel" },
  // Middle East – Streaming
  { url: "https://www.shahid.net", title: "Shahid (MBC)" },
  { url: "https://www.osn.com", title: "OSN" },
  // Africa – Major Streaming Service
  { url: "https://www.showmax.com", title: "Showmax (MultiChoice)" },
  // Canada – Local Streaming
  { url: "https://www.crave.ca", title: "Crave (Bell Media)" },
  { url: "https://www.ctv.ca", title: "CTV" },
  // Gaming-focused Platforms & Companies (new)
  { url: "https://www.roblox.com", title: "Roblox (gaming platform)" },
  { url: "https://www.steam.com", title: "Steam (Valve)" },
  { url: "https://www.ea.com", title: "Electronic Arts (EA)" },
  { url: "https://www.ubisoft.com", title: "Ubisoft" },
  // Additional Music Services / Identification
  { url: "https://www.shazam.com", title: "Shazam (Apple)" },

    // Science & Research (new additions)
  // Global Cross‑Cutting Platforms
  { url: "https://www.biorxiv.org", title: "bioRxiv (Cold Spring Harbor Laboratory)" },
  { url: "https://www.medrxiv.org", title: "medRxiv (Health Sciences Preprints)" },
  { url: "https://www.plos.org", title: "PLOS (Public Library of Science)" },
  { url: "https://www.science.org", title: "Science (AAAS)" },
  { url: "https://www.orcid.org", title: "ORCID (Researcher Identifier)" },
  { url: "https://www.dimensions.ai", title: "Dimensions (Research Analytics)" },
  { url: "https://www.scopus.com", title: "Scopus (Elsevier Abstract & Citation Database)" },

  // United States
  { url: "https://www.nsf.gov", title: "National Science Foundation (NSF)" },
  { url: "https://www.energy.gov", title: "U.S. Department of Energy (National Labs)" },
  { url: "https://www.caltech.edu", title: "California Institute of Technology (Caltech)" },

  // China
  { url: "https://www.wanfangdata.com.cn", title: "Wanfang Data (Research Portal)" },
  { url: "https://www.cas.cn", title: "Chinese Academy of Sciences (CAS)" },
  { url: "https://www.tsinghua.edu.cn", title: "Tsinghua University" },
  { url: "https://www.pku.edu.cn", title: "Peking University" },

  // United Kingdom
  { url: "https://www.cam.ac.uk", title: "University of Cambridge" },
  { url: "https://www.ox.ac.uk", title: "University of Oxford (main site)" },
  { url: "https://www.ucl.ac.uk", title: "University College London (UCL)" },
  { url: "https://www.imperial.ac.uk", title: "Imperial College London" },

  // Germany
  { url: "https://www.degruyter.com", title: "De Gruyter (Academic Publisher)" },
  { url: "https://www.uni-heidelberg.de", title: "Heidelberg University" },
  { url: "https://www.tum.de", title: "Technical University of Munich (TUM)" },
  { url: "https://www.lmu.de", title: "LMU Munich" },

  // Japan (new university main domains)
  { url: "https://www.u-tokyo.ac.jp", title: "University of Tokyo (main)" },

  // France
  { url: "https://www.universite-paris-saclay.fr", title: "Université Paris‑Saclay" },
  { url: "https://www.sorbonne-universite.fr", title: "Sorbonne Université" },
  { url: "https://www.psl.eu", title: "PSL (Paris Sciences et Lettres)" },
  { url: "https://www.hal.science", title: "HAL Science (French Open Archive)" },

  // South Korea
  { url: "https://www.kisti.re.kr", title: "KISTI (Korea Institute of Science and Technology Information)" },
  { url: "https://www.kaist.ac.kr", title: "KAIST" },
  { url: "https://www.snu.ac.kr", title: "Seoul National University (SNU)" },
  { url: "https://www.postech.ac.kr", title: "POSTECH" },
  { url: "https://www.msit.go.kr", title: "Ministry of Science and ICT (Korea)" },

  // Canada
  { url: "https://www.nrc-cnrc.gc.ca", title: "National Research Council Canada (NRC)" },
  { url: "https://www.utoronto.ca", title: "University of Toronto" },
  { url: "https://www.ubc.ca", title: "University of British Columbia (UBC)" },
  { url: "https://www.uwaterloo.ca", title: "University of Waterloo" },
  { url: "https://www.science.gc.ca", title: "Government of Canada – Science Portal" },

  // Switzerland
  { url: "https://www.epfl.ch", title: "EPFL (École polytechnique fédérale de Lausanne)" },
  { url: "https://www.swissuniversities.ch", title: "swissuniversities" },

  // Australia
  { url: "https://www.anu.edu.au", title: "Australian National University (ANU)" },
  { url: "https://www.unimelb.edu.au", title: "University of Melbourne" },
  { url: "https://www.unsw.edu.au", title: "UNSW Sydney" },
  { url: "https://www.uq.edu.au", title: "University of Queensland" },
  { url: "https://www.science.org.au", title: "Australian Academy of Science" },

  // India
  { url: "https://www.isro.gov.in", title: "Indian Space Research Organisation (ISRO)" },
  { url: "https://www.iitb.ac.in", title: "IIT Bombay" },
  { url: "https://www.tifr.res.in", title: "Tata Institute of Fundamental Research (TIFR)" },
  { url: "https://www.shodhganga.inflibnet.ac.in", title: "Shodhganga (Indian Thesis Repository)" },
  { url: "https://www.indiascienceandtechnology.gov.in", title: "India Science & Technology Portal" },

  // Italy
  { url: "https://www.miur.gov.it", title: "Ministry of University and Research (MIUR)" },
  { url: "https://www.infn.it", title: "Istituto Nazionale di Fisica Nucleare (INFN)" },
  { url: "https://www.sapienza.it", title: "Sapienza University of Rome" },
  { url: "https://www.polimi.it", title: "Politecnico di Milano" },
  { url: "https://www.unibo.it", title: "University of Bologna" },

  // Netherlands
  { url: "https://www.nwo.nl", title: "Dutch Research Council (NWO)" },
  { url: "https://www.knaw.nl", title: "Royal Netherlands Academy of Arts and Sciences (KNAW)" },
  { url: "https://www.uu.nl", title: "Utrecht University" },
  { url: "https://www.uva.nl", title: "University of Amsterdam" },
  { url: "https://www.tudelft.nl", title: "Delft University of Technology" },
  { url: "https://www.universiteitleiden.nl", title: "Leiden University" },
  { url: "https://www.elsevier.com", title: "Elsevier (Global Publisher, Dutch Roots)" },

  // Sweden
  { url: "https://www.vr.se", title: "Swedish Research Council" },
  { url: "https://www.ki.se", title: "Karolinska Institutet" },
  { url: "https://www.kth.se", title: "KTH Royal Institute of Technology" },
  { url: "https://www.su.se", title: "Stockholm University" },
  { url: "https://www.gu.se", title: "University of Gothenburg" },
  { url: "https://www.lu.se", title: "Lund University" },
  { url: "https://www.nobelprize.org", title: "Nobel Foundation" },

  // Spain
  { url: "https://www.ucm.es", title: "Universidad Complutense de Madrid" },
  { url: "https://www.ub.edu", title: "Universitat de Barcelona" },
  { url: "https://www.uam.es", title: "Universidad Autónoma de Madrid" },
  { url: "https://www.upc.edu", title: "Universitat Politècnica de Catalunya" },

    // Business, Company Registries & Stock Exchanges (new)
  // United States
  { url: "https://www.commerce.gov", title: "U.S. Department of Commerce" },
  { url: "https://www.chamberofcommerce.com", title: "U.S. Chamber of Commerce (portal)" },

  // Singapore
  { url: "https://www.business.gov.sg", title: "Singapore Business Portal" },
  { url: "https://www.sbfc.sg", title: "Singapore Business Federation" },

  // United Kingdom
  { url: "https://www.londonstockexchange.com", title: "London Stock Exchange (LSE)" },
  { url: "https://www.britishchambers.org.uk", title: "British Chambers of Commerce" },

  // Switzerland
  { url: "https://www.handelsregister.ch", title: "Swiss Commercial Register (Handelsregister)" },
  { url: "https://www.economiesuisse.ch", title: "economiesuisse (Swiss Business Federation)" },
  { url: "https://www.zurich.com", title: "Zurich Insurance Group (financial hub resources)" },

  // United Arab Emirates
  { url: "https://www.dfm.ae", title: "Dubai Financial Market (DFM)" },
  { url: "https://www.adx.ae", title: "Abu Dhabi Securities Exchange (ADX)" },
  { url: "https://www.mof.gov.ae", title: "UAE Ministry of Finance" },
  { url: "https://www.businesssetup.ae", title: "UAE Business Setup Portal" },

  // Canada
  { url: "https://www.tsx.com", title: "Toronto Stock Exchange (TSX)" },
  { url: "https://www.sedarplus.ca", title: "SEDAR+ (Canadian corporate filings)" },
  { url: "https://www.chamber.ca", title: "Canadian Chamber of Commerce" },

  // Netherlands
  { url: "https://www.kvk.nl", title: "Netherlands Chamber of Commerce (KVK)" },
  { url: "https://www.euronext.com", title: "Euronext (pan‑European exchange)" },
  { url: "https://www.afm.nl", title: "Netherlands Authority for the Financial Markets (AFM)" },

  // Japan
  { url: "https://www.jpx.co.jp", title: "Japan Exchange Group (JPX)" },
  { url: "https://www.keidanren.or.jp", title: "Keidanren (Japan Business Federation)" },
  { url: "https://www.toyokeizai.net", title: "Toyo Keizai Online (business news)" },
  { url: "https://www.nikkei.com", title: "Nihon Keizai Shimbun (Nikkei)" },

  // Saudi Arabia
  { url: "https://www.cma.org.sa", title: "Capital Market Authority (CMA)" },
  { url: "https://www.tadawul.com.sa", title: "Saudi Stock Exchange (Tadawul)" },
  { url: "https://www.mci.gov.sa", title: "Ministry of Commerce (Saudi Arabia)" },
  { url: "https://www.misa.gov.sa", title: "Ministry of Investment (MISA)" },
  { url: "https://www.saudichamber.com.sa", title: "Council of Saudi Chambers" },

  // Norway
  { url: "https://www.brreg.no", title: "Brønnøysund Register Centre (company registry)" },
  { url: "https://www.nfd.no", title: "Ministry of Trade, Industry and Fisheries (Norway)" },
  { url: "https://www.innovasjonnorge.no", title: "Innovation Norway" },
  { url: "https://www.nho.no", title: "Confederation of Norwegian Enterprise (NHO)" },

  // New Zealand
  { url: "https://www.companiesoffice.govt.nz", title: "New Zealand Companies Office" },
  { url: "https://www.nzx.com", title: "New Zealand Exchange (NZX)" },
  { url: "https://www.business.govt.nz", title: "New Zealand Business Portal" },
  { url: "https://www.nzchamber.co.nz", title: "New Zealand Chambers of Commerce" },

  // Sweden
  { url: "https://www.bolagsverket.se", title: "Swedish Companies Registration Office (Bolagsverket)" },
  { url: "https://www.svensktnaringsliv.se", title: "Confederation of Swedish Enterprise" },

  // Luxembourg
  { url: "https://www.guichet.public.lu", title: "Luxembourg Business Portal (Guichet)" },
  { url: "https://www.luxse.lu", title: "Luxembourg Stock Exchange (LuxSE)" },
  { url: "https://www.cssf.lu", title: "CSSF (Luxembourg financial regulator)" },
  { url: "https://www.chamber.lu", title: "Luxembourg Chamber of Commerce" },

  // Israel
  { url: "https://www.tase.co.il", title: "Tel Aviv Stock Exchange (TASE)" },
  { url: "https://www.iva.org.il", title: "Israel Venture Association (IVA)" },
  { url: "https://www.boi.org.il", title: "Bank of Israel" },

  // Cyprus
  { url: "https://www.drcor.mcit.gov.cy", title: "Department of Registrar of Companies (Cyprus)" },
  { url: "https://www.cysec.gov.cy", title: "CySEC (Cyprus Securities and Exchange Commission)" },
  { url: "https://www.cypruschamber.eu", title: "Cyprus Chamber of Commerce and Industry" },
  { url: "https://www.cse.com.cy", title: "Cyprus Stock Exchange (CSE)" },

  // Australia (business‑specific additions, noting `asic.gov.au`, `asx.com.au` already present)
  { url: "https://www.abr.business.gov.au", title: "Australian Business Register (ABN lookup)" },
  { url: "https://www.business.gov.au", title: "Australian Business Portal" },
  { url: "https://www.australianchamber.com.au", title: "Australian Chamber of Commerce and Industry" },

  // Ireland
  { url: "https://www.cro.ie", title: "Companies Registration Office (CRO)" },
  { url: "https://www.enterprise-ireland.com", title: "Enterprise Ireland" },
  { url: "https://www.euronext.com/en/markets/dublin", title: "Euronext Dublin (ISE)" },
  { url: "https://www.revenue.ie", title: "Irish Revenue (Tax & Corporate)" },
  { url: "https://www.ibec.ie", title: "IBEC (Irish Business and Employers Confederation)" },

  // Estonia (business‑specific portals, `eesti.ee` already present, but adding specialised ones)
  { url: "https://www.e-resident.gov.ee", title: "Estonian e‑Residency (global business)" },
  { url: "https://www.eas.ee", title: "Enterprise Estonia" },

  // Finland
  { url: "https://www.prh.fi", title: "Finnish Patent and Registration Office (PRH)" },
  { url: "https://www.tem.fi", title: "Ministry of Economic Affairs and Employment (Finland)" },
  { url: "https://www.ek.fi", title: "Confederation of Finnish Industries (EK)" },

  // Denmark (business registries, `virk.dk` already present)
  { url: "https://www.di.dk", title: "Confederation of Danish Industry (DI)" },

  // Global Business Intelligence & Data Tools (new)
  { url: "https://www.crunchbase.com", title: "Crunchbase (company data)" },
  { url: "https://www.pitchbook.com", title: "PitchBook (financial data & research)" },

    // Travel & Hospitality (new)
  // United States
  { url: "https://www.travel.state.gov", title: "U.S. Travel.State.Gov (Visas & Travel Info)" },
  { url: "https://www.hilton.com", title: "Hilton Hotels & Resorts" },
  { url: "https://www.marriott.com", title: "Marriott International" },
  { url: "https://www.hyatt.com", title: "Hyatt Hotels" },
  { url: "https://www.delta.com", title: "Delta Air Lines" },
  { url: "https://www.united.com", title: "United Airlines" },
  { url: "https://www.americanairlines.com", title: "American Airlines" },
  { url: "https://disneyworld.disney.go.com", title: "Walt Disney World Resort" },
  { url: "https://www.universalorlando.com", title: "Universal Orlando Resort" },

  // Spain
  { url: "https://www.spain.info", title: "Official Spanish Tourism Board (TURESPAÑA)" },
  { url: "https://www.renfe.com", title: "Renfe (Spanish Railways)" },
  { url: "https://www.iberia.com", title: "Iberia Airlines" },
  { url: "https://www.melia.com", title: "Meliá Hotels International" },
  { url: "https://www.nh-hoteles.com", title: "NH Hotel Group" },
  { url: "https://www.barcelo.com", title: "Barceló Hotel Group" },
  { url: "https://www.visitbarcelona.com", title: "Visit Barcelona" },
  { url: "https://www.paradores.es", title: "Paradores de Turismo (Historic Hotels)" },

  // Japan
  { url: "https://www.japan.travel", title: "Japan National Tourism Organization (JNTO)" },
  { url: "https://www.jrpass.com", title: "Japan Rail Pass (official reseller)" },
  { url: "https://www.jreast.co.jp", title: "JR East (Railways)" },
  { url: "https://www.ana.co.jp", title: "All Nippon Airways (ANA)" },
  { url: "https://www.jal.co.jp", title: "Japan Airlines (JAL)" },
  { url: "https://www.rakutentravel.com", title: "Rakuten Travel" },
  { url: "https://www.jalan.net", title: "Jalan (Japanese travel booking)" },
  { url: "https://www.hoshinoya.com", title: "Hoshinoya Resorts (Luxury Ryokan)" },
  { url: "https://www.tokyodisneyresort.jp", title: "Tokyo Disney Resort" },
  { url: "https://www.usj.co.jp", title: "Universal Studios Japan" },

  // France
  { url: "https://www.france.fr", title: "France.fr (Official Tourism – Atout France)" },
  { url: "https://www.airfrance.com", title: "Air France" },
  { url: "https://www.accor.com", title: "Accor Group (Sofitel, Novotel, Ibis, etc.)" },
  { url: "https://www.sncf.com", title: "SNCF (French Railways/TGV)" },
  { url: "https://www.parisjetaime.com", title: "Paris je t'aime (Official Tourism)" },
  { url: "https://www.cotedazur.fr", title: "Côte d’Azur Tourism" },
  { url: "https://www.disneylandparis.com", title: "Disneyland Paris" },

  // Australia
  { url: "https://www.australia.com", title: "Tourism Australia" },
  { url: "https://www.qantas.com", title: "Qantas Airways" },
  { url: "https://www.virginaustralia.com.au", title: "Virgin Australia" },
  { url: "https://www.greatbarrierreef.org", title: "Great Barrier Reef Info" },
  { url: "https://www.visitnsw.com", title: "Visit NSW (New South Wales)" },
  { url: "https://www.queensland.com", title: "Queensland Tourism" },
  { url: "https://www.parksaustralia.gov.au", title: "Parks Australia" },

  // Germany
  { url: "https://www.germany.travel", title: "German National Tourist Board (DZT)" },
  { url: "https://www.lufthansa.com", title: "Lufthansa" },
  { url: "https://www.deutschebahn.com", title: "Deutsche Bahn (German Railways)" },
  { url: "https://www.tui.com", title: "TUI Group (Travel & Hotels)" },
  { url: "https://www.berlin.de", title: "Berlin Official Tourism" },
  { url: "https://www.muenchen.de", title: "Munich Official Tourism" },

  // United Kingdom
  { url: "https://www.visitbritain.com", title: "VisitBritain (Official UK Tourism)" },
  { url: "https://www.britishairways.com", title: "British Airways" },
  { url: "https://www.nationaltrust.org.uk", title: "National Trust (Historic Sites)" },
  { url: "https://www.visitlondon.com", title: "Visit London" },
  { url: "https://www.easyjet.com", title: "easyJet" },
  { url: "https://www.ryanair.com", title: "Ryanair" },
  { url: "https://www.premierinn.com", title: "Premier Inn" },
  { url: "https://www.travelodge.co.uk", title: "Travelodge UK" },

  // China
  { url: "https://www.ctrip.com", title: "Ctrip (Trip.com Group – Chinese OTA)" },
  { url: "https://www.fliggy.com", title: "Fliggy (Alibaba Travel)" },
  { url: "https://www.airchina.com", title: "Air China" },
  { url: "https://www.ceair.com", title: "China Eastern Airlines" },
  { url: "https://www.elong.com", title: "eLong (Chinese OTA)" },
  { url: "https://www.ly.com", title: "LY.com (Chinese travel booking)" },

  // Italy
  { url: "https://www.italia.it", title: "Italia.it (Official Italian Tourism – ENIT)" },
  { url: "https://www.ita-airways.com", title: "ITA Airways (Alitalia successor)" },
  { url: "https://www.trenitalia.com", title: "Trenitalia (Italian Railways)" },
  { url: "https://www.venicewelcome.com", title: "Venice Official Tourism" },
  { url: "https://www.roma.it", title: "Rome Official Tourism" },

  // Switzerland
  { url: "https://www.myswitzerland.com", title: "Switzerland Tourism" },
  { url: "https://www.swiss.com", title: "Swiss International Air Lines" },
  { url: "https://www.sbb.ch", title: "Swiss Federal Railways (SBB)" },
  { url: "https://www.jungfrau.ch", title: "Jungfrau Region Tourism" },
  { url: "https://www.ritzcarlton.com", title: "The Ritz‑Carlton Hotel Company" },

  // Singapore
  { url: "https://www.visitsingapore.com", title: "Singapore Tourism Board" },
  { url: "https://www.singaporeair.com", title: "Singapore Airlines" },
  { url: "https://www.klook.com", title: "Klook (Experiences & Activities)" },
  { url: "https://www.marinabaysands.com", title: "Marina Bay Sands" },
  { url: "https://www.sentosa.com.sg", title: "Sentosa (Island Resort)" },
  { url: "https://www.changiairport.com", title: "Changi Airport" },

  // Portugal
  { url: "https://www.visitportugal.com", title: "Turismo de Portugal" },
  { url: "https://www.flytap.com", title: "TAP Air Portugal" },
  { url: "https://www.visitlisboa.com", title: "Visit Lisboa" },
  { url: "https://www.visitporto.travel", title: "Visit Porto" },
  { url: "https://www.pousadas.pt", title: "Pousadas de Portugal (Historic Inns)" },

  // United Arab Emirates
  { url: "https://www.visitdubai.com", title: "Visit Dubai" },
  { url: "https://www.visitabudhabi.ae", title: "Visit Abu Dhabi" },
  { url: "https://www.emirates.com", title: "Emirates Airline" },
  { url: "https://www.etihad.com", title: "Etihad Airways" },
  { url: "https://www.atlantis.com", title: "Atlantis Resorts (The Palm / The Royal)" },
  { url: "https://www.jumeirah.com", title: "Jumeirah Hotels & Resorts (Burj Al Arab)" },

  // Austria
  { url: "https://www.austria.info", title: "Austrian National Tourist Office" },
  { url: "https://www.oebb.at", title: "ÖBB (Austrian Federal Railways)" },
  { url: "https://www.austrian.com", title: "Austrian Airlines" },
  { url: "https://www.salzburg.info", title: "Salzburg Official Tourism" },
  { url: "https://www.vienna.info", title: "Vienna Official Tourism" },
  { url: "https://www.tyrol.com", title: "Tyrol Regional Tourism" },

  // South Korea
  { url: "https://www.english.visitkorea.or.kr", title: "Korea Tourism Organization (Visit Korea)" },
  { url: "https://www.koreanair.com", title: "Korean Air" },
  { url: "https://www.flyasiana.com", title: "Asiana Airlines" },
  { url: "https://www.seoul.go.kr", title: "Seoul Metropolitan Government (Tourism)" },

  // Greece
  { url: "https://www.visitgreece.gr", title: "Greek National Tourism Organisation" },
  { url: "https://www.aegeanair.com", title: "Aegean Airlines" },

  // Netherlands
  { url: "https://www.holland.com", title: "Netherlands Board of Tourism (Holland.com)" },
  { url: "https://www.klm.com", title: "KLM Royal Dutch Airlines" },
  { url: "https://www.ns.nl", title: "Dutch Railways (NS)" },
  { url: "https://www.iamsterdam.com", title: "I amsterdam (City Tourism)" },
  { url: "https://www.rotterdam.info", title: "Rotterdam Tourism" },

  // Canada
  { url: "https://www.canada.travel", title: "Destination Canada (Official Tourism)" },
  { url: "https://www.aircanada.com", title: "Air Canada" },
  { url: "https://www.viarail.ca", title: "VIA Rail Canada" },
  { url: "https://www.parks.canada.ca", title: "Parks Canada" },

  // Thailand
  { url: "https://www.tourismthailand.org", title: "Tourism Authority of Thailand" },
  { url: "https://www.thaiairways.com", title: "Thai Airways" },
  { url: "https://www.agoda.com", title: "Agoda (Online Travel Booking – Asia)" },

  // Mexico
  { url: "https://www.visitmexico.com", title: "Visit México (Official Tourism)" },
  { url: "https://www.aeromexico.com", title: "Aeroméxico" },

  // Global Search / Aggregators / Transport (new)
  { url: "https://www.skyscanner.net", title: "Skyscanner (Flight Comparison)" },
  { url: "https://www.uber.com", title: "Uber (Ride & Ground Transport)" },
  { url: "https://www.lyft.com", title: "Lyft (Ride‑Sharing)" },

    // Sports – Global Top Sites & Major Organizations
  { url: "https://www.espn.com", title: "ESPN" },
  { url: "https://www.bbc.com/sport", title: "BBC Sport" },
  { url: "https://www.fifa.com", title: "FIFA" },
  { url: "https://www.nba.com", title: "NBA" },
  { url: "https://www.olympics.com", title: "IOC / Olympics" },
  { url: "https://www.nfl.com", title: "NFL" },
  { url: "https://www.uefa.com", title: "UEFA" },
  { url: "https://www.cbssports.com", title: "CBS Sports" },
  { url: "https://www.theathletic.com", title: "The Athletic" },
  { url: "https://www.skysports.com", title: "Sky Sports" },
  { url: "https://www.foxsports.com", title: "Fox Sports" },
  { url: "https://sports.yahoo.com", title: "Yahoo Sports" },
  { url: "https://www.bleacherreport.com", title: "Bleacher Report" },
  { url: "https://www.goal.com", title: "GOAL" },
  { url: "https://www.transfermarkt.com", title: "Transfermarkt" },
  { url: "https://www.mlb.com", title: "MLB" },
  { url: "https://www.nhl.com", title: "NHL" },
  { url: "https://www.premierleague.com", title: "English Premier League" },
  { url: "https://www.formula1.com", title: "Formula 1" },
  { url: "https://www.espncricinfo.com", title: "ESPNcricinfo" },
  { url: "https://www.cricket.com.au", title: "Cricket Australia" },

  // Sports – United States (additional)
  { url: "https://www.si.com", title: "Sports Illustrated" },
  { url: "https://www.ncaa.com", title: "NCAA (college sports)" },

  // Sports – Spain
  { url: "https://www.marca.com", title: "Marca" },
  { url: "https://www.as.com", title: "AS.com" },
  { url: "https://www.mundodeportivo.com", title: "Mundo Deportivo" },
  { url: "https://www.sport.es", title: "Sport (Spain)" },
  { url: "https://www.laliga.com", title: "LaLiga" },
  { url: "https://www.rfef.es", title: "Real Federación Española de Fútbol" },
  { url: "https://www.acb.com", title: "ACB (Basketball)" },
  { url: "https://www.lavanguardia.com/deportes", title: "La Vanguardia – Deportes" },

  // Sports – Japan
  { url: "https://www.jleague.jp", title: "J.League" },
  { url: "https://www.nhk.or.jp/sports", title: "NHK Sports" },
  { url: "https://www.nikkansports.com", title: "Nikkan Sports" },
  { url: "https://www.npb.jp", title: "Nippon Professional Baseball (NPB)" },
  { url: "https://www.jfa.jp", title: "Japan Football Association" },
  { url: "https://sports.yahoo.co.jp", title: "Yahoo! Japan Sports" },

  // Sports – France
  { url: "https://www.lequipe.fr", title: "L'Équipe" },
  { url: "https://www.lfp.fr", title: "LFP (Ligue 1)" },
  { url: "https://www.fff.fr", title: "French Football Federation" },
  { url: "https://www.eurosport.fr", title: "Eurosport France" },
  { url: "https://www.rmcsport.bfmtv.com", title: "RMC Sport / BFMTV" },

  // Sports – Australia
  { url: "https://www.foxsports.com.au", title: "Fox Sports Australia" },
  { url: "https://www.afl.com.au", title: "AFL (Australian Football League)" },
  { url: "https://www.nrl.com", title: "NRL (Rugby League)" },
  { url: "https://www.abc.net.au/sport", title: "ABC Sport" },
  { url: "https://www.supercars.com", title: "Supercars" },
  { url: "https://www.netball.com.au", title: "Netball Australia" },

  // Sports – Germany
  { url: "https://www.kicker.de", title: "kicker" },
  { url: "https://www.sport1.de", title: "Sport1" },
  { url: "https://www.bundesliga.com", title: "Bundesliga" },
  { url: "https://www.dfb.de", title: "German Football Association" },
  { url: "https://www.bild.de/sport", title: "Bild – Sport" },
  { url: "https://www.spox.com", title: "Spox" },
  { url: "https://www.ran.de", title: "ran.de (Sport)" },
  { url: "https://www.eurosport.de", title: "Eurosport Germany" },
  { url: "https://www.transfermarkt.de", title: "Transfermarkt (German edition)" },
  { url: "https://www.sportbild.de", title: "Sport Bild" },

  // Sports – United Kingdom (additional to global)
  { url: "https://www.bbc.co.uk/sport", title: "BBC Sport (UK)" },
  { url: "https://www.theguardian.com/sport", title: "The Guardian – Sport" },
  { url: "https://www.telegraph.co.uk/sport", title: "The Telegraph – Sport" },
  { url: "https://www.dailymail.co.uk/sport", title: "Daily Mail – Sport" },
  { url: "https://www.independent.co.uk/sport", title: "The Independent – Sport" },
  { url: "https://www.fourfourtwo.com", title: "FourFourTwo" },
  { url: "https://www.eurosport.co.uk", title: "Eurosport UK" },

  // Sports – China
  { url: "https://sports.cctv.com", title: "CCTV Sports" },
  { url: "https://sports.sina.com.cn", title: "Sina Sports" },
  { url: "https://sports.qq.com", title: "Tencent Sports" },
  { url: "https://www.hupu.com", title: "Hupu (basketball focus)" },
  { url: "https://www.cfa.cn", title: "Chinese Football Association" },
  { url: "https://www.nba.cn", title: "NBA China" },
  { url: "https://sports.163.com", title: "NetEase Sports" },
  { url: "https://sports.sohu.com", title: "Sohu Sports" },
  { url: "https://sports.ifeng.com", title: "iFeng Sports" },

  // Sports – Italy
  { url: "https://www.gazzetta.it", title: "La Gazzetta dello Sport" },
  { url: "https://www.corriere.it/sport", title: "Corriere dello Sport – Sport" },
  { url: "https://www.tuttosport.com", title: "Tuttosport" },
  { url: "https://www.legaseriea.it", title: "Serie A" },
  { url: "https://www.figc.it", title: "FIGC (Italian Football Federation)" },
  { url: "https://www.sky.it/sport", title: "Sky Sport Italy" },
  { url: "https://www.repubblica.it/sport", title: "La Repubblica – Sport" },
  { url: "https://www.sportmediaset.it", title: "Sport Mediaset" },
  { url: "https://www.calciomercato.com", title: "Calciomercato" },
  { url: "https://www.corrieredellosport.it", title: "Corriere dello Sport" },

  // Sports – Switzerland
  { url: "https://www.srf.ch/sport", title: "SRF Sport" },
  { url: "https://www.fis-ski.com", title: "FIS (International Ski Federation)" },
  { url: "https://www.sport.ch", title: "Sport.ch" },
  { url: "https://www.bluewin.ch/sport", title: "Bluewin – Sport" },
  { url: "https://www.20min.ch/sport", title: "20 Minuten – Sport" },
  { url: "https://www.nzz.ch/sport", title: "NZZ – Sport" },
  { url: "https://www.lematin.ch/sport", title: "Le Matin – Sport" },
  { url: "https://www.swiss-ski.ch", title: "Swiss Ski" },

  // Sports – Singapore
  { url: "https://www.straitstimes.com/sport", title: "The Straits Times – Sport" },
  { url: "https://www.channelnewsasia.com/sport", title: "CNA Sport" },
  { url: "https://www.todayonline.com/sport", title: "TODAY – Sport" },
  { url: "https://www.football.sg", title: "Football Association of Singapore" },
  { url: "https://www.sfa.org.sg", title: "Sport Singapore" },
  { url: "https://www.asiaone.com/sport", title: "AsiaOne – Sport" },

  // Sports – Portugal
  { url: "https://www.abola.pt", title: "A Bola" },
  { url: "https://www.record.pt", title: "Record" },
  { url: "https://www.ojogo.pt", title: "O Jogo" },
  { url: "https://www.fpf.pt", title: "Portuguese Football Federation" },
  { url: "https://www.slbenfica.pt", title: "SL Benfica" },
  { url: "https://www.fcporto.pt", title: "FC Porto" },
  { url: "https://www.sporting.pt", title: "Sporting CP" },
  { url: "https://www.maisfutebol.iol.pt", title: "Maisfutebol" },
  { url: "https://www.dn.pt/desporto", title: "Diário de Notícias – Desporto" },
  { url: "https://www.rtp.pt/desporto", title: "RTP Desporto" },
  { url: "https://www.zerozero.pt", title: "ZeroZero (stats)" },

  // Sports – UAE
  { url: "https://www.gulfnews.com/sport", title: "Gulf News – Sport" },
  { url: "https://www.thenationalnews.com/sport", title: "The National – Sport" },
  { url: "https://www.uaeproleague.ae", title: "UAE Pro League" },
  { url: "https://www.dubaisports.ae", title: "Dubai Sports Council" },
  { url: "https://www.khaleejtimes.com/sport", title: "Khaleej Times – Sport" },

  // Sports – Austria
  { url: "https://www.krone.at/sport", title: "Kronen Zeitung – Sport" },
  { url: "https://www.sport.orf.at", title: "ORF Sport" },
  { url: "https://www.kurier.at/sport", title: "Kurier – Sport" },
  { url: "https://www.oefb.at", title: "ÖFB (Austrian Football Association)" },
  { url: "https://www.redbull.com", title: "Red Bull Sports" },
  { url: "https://www.diepresse.com/sport", title: "Die Presse – Sport" },
  { url: "https://www.derstandard.at/sport", title: "Der Standard – Sport" },

  // Sports – South Korea
  { url: "https://sports.naver.com", title: "Naver Sports" },
  { url: "https://sports.daum.net", title: "Daum Sports" },
  { url: "https://www.kfa.or.kr", title: "Korea Football Association" },
  { url: "https://www.kleague.com", title: "K League" },
  { url: "https://www.kbs.co.kr/sports", title: "KBS Sports" },
  { url: "https://www.sbs.co.kr/sports", title: "SBS Sports" },
  { url: "https://www.mbc.co.kr/sports", title: "MBC Sports" },

  // Sports – Greece
  { url: "https://www.gazzetta.gr", title: "Gazzetta.gr" },
  { url: "https://www.sport24.gr", title: "Sport24" },
  { url: "https://www.sdna.gr", title: "SDNA" },
  { url: "https://www.epo.gr", title: "Hellenic Football Federation" },
  { url: "https://www.onsports.gr", title: "Onsports" },
  { url: "https://www.protothema.gr/sports", title: "Proto Thema – Sports" },

  // Sports – Netherlands
  { url: "https://www.nos.nl/sport", title: "NOS Sport" },
  { url: "https://www.telegraaf.nl/sport", title: "De Telegraaf – Sport" },
  { url: "https://www.voetbalprimeur.nl", title: "Voetbalprimeur" },
  { url: "https://www.knvb.nl", title: "KNVB (Dutch Football Federation)" },
  { url: "https://www.eredivisie.nl", title: "Eredivisie" },
  { url: "https://www.vi.nl", title: "Voetbal International" },
  { url: "https://www.sport1.nl", title: "Sport1 NL" },

  // Sports – Canada
  { url: "https://www.tsn.ca", title: "TSN" },
  { url: "https://www.sportsnet.ca", title: "Sportsnet" },
  { url: "https://www.cbc.ca/sports", title: "CBC Sports" },
  { url: "https://www.thehockeynews.com", title: "The Hockey News" },
  { url: "https://www.basketball.ca", title: "Canada Basketball" },
  { url: "https://www.canadasoccer.com", title: "Canada Soccer" },
  { url: "https://www.olympic.ca", title: "Canadian Olympic Committee" },

  // Sports – Thailand
  { url: "https://www.siamsport.co.th", title: "Siam Sport" },
  { url: "https://www.thairath.co.th/sport", title: "Thai Rath – Sport" },
  { url: "https://www.pptvhd36.com/sport", title: "PPTV HD36 – Sport" },
  { url: "https://www.fat.or.th", title: "Football Association of Thailand" },
  { url: "https://www.thaileague.co.th", title: "Thai League" },
  { url: "https://www.dailynews.co.th/sport", title: "Daily News – Sport" },
  { url: "https://www.sanook.com/sport", title: "Sanook Sport" },

  // Sports – Mexico
  { url: "https://www.espn.com.mx", title: "ESPN Mexico" },
  { url: "https://www.marca.com/mexico", title: "Marca México" },
  { url: "https://www.record.com.mx", title: "Récord" },
  { url: "https://www.foxsports.com.mx", title: "Fox Sports México" },
  { url: "https://www.azteca7.com/deportes", title: "Azteca 7 – Deportes" },
  { url: "https://www.femexfut.org.mx", title: "FMF (Mexican Football Federation)" },
  { url: "https://www.ligamx.net", title: "Liga MX" },
  { url: "https://www.milenio.com/deportes", title: "Milenio – Deportes" },

    // Forums & Communities (new)
  // Top Global & US
  { url: "https://www.fandom.com", title: "Fandom (Wikia) – Wikis & Forums" },
  { url: "https://www.gamefaqs.com", title: "GameFAQs – Gaming Community" },
  { url: "https://www.physicsforums.com", title: "Physics Forums" },
  { url: "https://www.medhelp.org", title: "MedHelp (Health Community)" },
  { url: "https://www.city-data.com", title: "City-Data (US Local Discussions)" },
  { url: "https://www.bodybuilding.com", title: "Bodybuilding.com Forums" },
  { url: "https://www.chess.com", title: "Chess.com (Forums & Play)" },
  { url: "https://www.lichess.org", title: "Lichess (Chess Forums)" },
  { url: "https://www.straightdope.com", title: "The Straight Dope (Q&A)" },
  { url: "https://www.fark.com", title: "Fark (News/Community)" },
  { url: "https://www.dailykos.com", title: "Daily Kos (Political Community)" },
  { url: "https://www.neogaf.com", title: "NeoGAF (Gaming Forums)" },

  // United Kingdom
  { url: "https://www.mumsnet.com", title: "Mumsnet (Parenting Community)" },
  { url: "https://www.thestudentroom.co.uk", title: "The Student Room" },
  { url: "https://www.pistonheads.com", title: "PistonHeads (Cars)" },
  { url: "https://www.moneysavingexpert.com", title: "MoneySavingExpert (Finance Forums)" },
  { url: "https://www.digitalspy.com", title: "Digital Spy (TV/Entertainment)" },
  { url: "https://www.railforums.co.uk", title: "RailUK Forums" },
  { url: "https://www.ukclimbing.com", title: "UKClimbing (Outdoor)" },
  { url: "https://www.cyclinguk.org", title: "Cycling UK Forums" },

  // China
  { url: "https://tieba.baidu.com", title: "Baidu Tieba (Interest Groups)" },
  { url: "https://www.douban.com/groups", title: "Douban Groups (Lifestyle/Culture)" },
  { url: "https://bbs.csdn.net", title: "CSDN Forums (Tech/Developers)" },
  { url: "https://www.chiphell.com", title: "Chiphell (Hardware/Tech)" },
  { url: "https://www.xcar.com.cn", title: "XCar (Cars/Automotive)" },
  { url: "https://www.tianya.cn", title: "Tianya (General Forum, historic)" },
  { url: "https://www.mop.com", title: "Mop (Entertainment/Community)" },

  // Germany
  { url: "https://www.gutefrage.net", title: "Gutefrage (Q&A)" },
  { url: "https://www.computerbase.de", title: "ComputerBase (Tech)" },
  { url: "https://www.motor-talk.de", title: "Motor-Talk (Cars)" },
  { url: "https://www.chefkoch.de", title: "Chefkoch (Cooking Community)" },
  { url: "https://www.eltern.de", title: "Eltern (Parenting)" },
  { url: "https://www.ubuntuusers.de", title: "Ubuntu Users (Linux Forum)" },

  // Japan
  { url: "https://www.2ch.net", title: "2channel (5ch – Anonymous Textboard)" },
  { url: "https://www.5ch.net", title: "5channel (Former 2ch)" },
  { url: "https://matome.naver.jp", title: "Naver Matome (Curated Discussions)" },
  { url: "https://chiebukuro.yahoo.co.jp", title: "Yahoo! Chiebukuro (Q&A)" },
  { url: "https://www.biglobe.ne.jp", title: "BIGLOBE (Forums/Community)" },
  { url: "https://www.excite.co.jp", title: "Excite Japan (Community/News)" },

  // France
  { url: "https://www.jeuxvideo.com", title: "Jeuxvideo.com (Gaming Forums)" },
  { url: "https://www.commentcamarche.net", title: "Commentçamarche (Tech Q&A)" },
  { url: "https://www.doctissimo.fr", title: "Doctissimo (Health/Wellness)" },
  { url: "https://www.aufeminin.com", title: "AuFeminin (Women/Lifestyle)" },
  { url: "https://www.linternaute.com", title: "Linternaute (Forums/General)" },
  { url: "https://www.zestedesavoir.com", title: "Zeste de Savoir (Knowledge Sharing)" },

  // India
  { url: "https://www.mouthshut.com", title: "MouthShut (Reviews/Opinions)" },
  { url: "https://www.indiamike.com", title: "IndiaMike (Travel Community)" },
  { url: "https://www.team-bhp.com", title: "Team-BHP (Indian Cars)" },
  { url: "https://www.desidime.com", title: "DesiDime (Deals/Community)" },

  // Australia
  { url: "https://www.whirlpool.net.au", title: "Whirlpool (Tech/General)" },
  { url: "https://www.productreview.com.au", title: "ProductReview.com.au (Reviews)" },
  { url: "https://www.mumbrella.com.au", title: "Mumbrella (Media/Marketing Forums)" },
  { url: "https://www.essentialbaby.com.au", title: "Essential Baby (Parenting)" },

  // South Korea
  { url: "https://www.dcinside.com", title: "DC Inside (Major Korean Community)" },
  { url: "https://www.fmkorea.com", title: "FM Korea (Sports/Gaming)" },
  { url: "https://www.ilbe.com", title: "Ilbe (Controversial Forum)" },
  { url: "https://cafe.naver.com", title: "Naver Cafe (Huge Interest Groups)" },
  { url: "https://www.ruliweb.com", title: "Ruliweb (Gaming/Community)" },
  { url: "https://www.ppomppu.co.kr", title: "Ppomppu (Deals/Tech)" },
  { url: "https://www.clien.net", title: "Clien (Tech/General)" },

  // Italy
  { url: "https://forum.alfemminile.com", title: "AlFemminile (Women/Lifestyle)" },
  { url: "https://www.hwupgrade.it", title: "HWUpgrade (Tech)" },
  { url: "https://www.pianetadonna.it", title: "PianetaDonna (Lifestyle)" },

  // Netherlands
  { url: "https://www.tweakers.net", title: "Tweakers (Tech/Reviews)" },
  { url: "https://www.fok.nl", title: "FOK! (General Forum)" },
  { url: "https://www.viva.nl", title: "Viva (Women/Lifestyle)" },
  { url: "https://www.autoweb.nl", title: "AutoWeb (Cars)" },

  // Singapore
  { url: "https://www.hardwarezone.com.sg", title: "HardwareZone (Tech)" },
  { url: "https://forums.singaporeexpats.com", title: "Singapore Expats Forum" },
  { url: "https://www.kiasuparents.com", title: "Kiasu Parents (Education/Parenting)" },
  { url: "https://www.sgforums.com", title: "SGForums (General)" },
  { url: "https://www.lowyat.net", title: "Lowyat.NET (Tech, MY/SG)" },

  // Canada
  { url: "https://www.redflagdeals.com", title: "RedFlagDeals (Deals/Forums)" },
  { url: "https://www.canadiancontent.net", title: "Canadian Content (General)" },
  { url: "https://www.mapleleafweb.com", title: "Mapleleafweb (Politics)" },
  { url: "https://www.canadaforums.ca", title: "Canada Forums" },

  // Switzerland
  { url: "https://www.englishforum.ch", title: "English Forum Switzerland" },
  { url: "https://www.swissinfo.ch", title: "SWI swissinfo.ch (News/Community)" },
  { url: "https://www.ricardo.ch", title: "Ricardo (Marketplace/Community)" },

    // Non‑Profit & NGOs (new)
  // Global
  { url: "https://www.amnesty.org", title: "Amnesty International" },
  { url: "https://www.greenpeace.org", title: "Greenpeace" },
  { url: "https://www.wwf.org", title: "World Wildlife Fund (WWF)" },
  { url: "https://www.wfp.org", title: "World Food Programme (WFP)" },
  { url: "https://www.hrw.org", title: "Human Rights Watch" },
  { url: "https://www.transparency.org", title: "Transparency International" },
  { url: "https://www.habitat.org", title: "Habitat for Humanity" },
  { url: "https://www.rsf.org", title: "Reporters Without Borders (RSF)" },
  { url: "https://www.one.org", title: "ONE Campaign" },

  // United States
  { url: "https://www.nrdc.org", title: "Natural Resources Defense Council (NRDC)" },
  { url: "https://www.feedingamerica.org", title: "Feeding America" },
  { url: "https://www.charitynavigator.org", title: "Charity Navigator" },
  { url: "https://www.givewell.org", title: "GiveWell" },
  { url: "https://www.humanrightsfirst.org", title: "Human Rights First" },

  // United Kingdom
  { url: "https://www.oxfam.org.uk", title: "Oxfam GB" },
  { url: "https://www.savethechildren.org.uk", title: "Save the Children UK" },
  { url: "https://www.britishredcross.org.uk", title: "British Red Cross" },
  { url: "https://www.amnesty.org.uk", title: "Amnesty International UK" },
  { url: "https://www.greenpeace.org.uk", title: "Greenpeace UK" },
  { url: "https://www.cafonline.org", title: "Charities Aid Foundation (CAF)" },
  { url: "https://www.nspcc.org.uk", title: "NSPCC (Children's charity)" },
  { url: "https://www.ageuk.org.uk", title: "Age UK" },
  { url: "https://www.cancerresearchuk.org", title: "Cancer Research UK" },

  // Switzerland (international HQs)
  { url: "https://www.msf.org", title: "Médecins Sans Frontières (MSF) International" },
  { url: "https://www.iom.int", title: "International Organization for Migration (IOM)" },
  { url: "https://www.unhcr.org", title: "UNHCR (UN Refugee Agency)" },

  // Germany
  { url: "https://www.greenpeace.de", title: "Greenpeace Deutschland" },
  { url: "https://www.amnesty.de", title: "Amnesty International Deutschland" },
  { url: "https://www.brot-fuer-die-welt.de", title: "Brot für die Welt" },
  { url: "https://www.caritas.de", title: "Caritas Deutschland" },
  { url: "https://www.diakonie.de", title: "Diakonie Deutschland" },
  { url: "https://www.terre-des-hommes.de", title: "Terre des Hommes Deutschland" },
  { url: "https://www.nabu.de", title: "NABU (Nature and Biodiversity Conservation Union)" },
  { url: "https://www.deutsches-rotes-kreuz.de", title: "Deutsches Rotes Kreuz" },

  // France
  { url: "https://www.medecins-sans-frontieres.fr", title: "Médecins Sans Frontières France" },
  { url: "https://www.amnesty.fr", title: "Amnesty International France" },
  { url: "https://www.greenpeace.fr", title: "Greenpeace France" },
  { url: "https://www.secours-populaire.fr", title: "Secours Populaire Français" },
  { url: "https://www.croix-rouge.fr", title: "Croix‑Rouge française" },
  { url: "https://www.unicef.fr", title: "UNICEF France" },
  { url: "https://www.fidh.org", title: "International Federation for Human Rights (FIDH)" },
  { url: "https://www.oxfamfrance.org", title: "Oxfam France" },

  // Japan
  { url: "https://www.jrc.or.jp", title: "Japanese Red Cross Society" },
  { url: "https://www.jica.go.jp", title: "Japan International Cooperation Agency (JICA)" },
  { url: "https://www.savechildren.or.jp", title: "Save the Children Japan" },
  { url: "https://www.greenpeace.jp", title: "Greenpeace Japan" },
  { url: "https://www.amnesty.or.jp", title: "Amnesty International Japan" },
  { url: "https://www.plan-international.jp", title: "Plan International Japan" },
  { url: "https://www.habitat-japan.org", title: "Habitat for Humanity Japan" },

  // China
  { url: "https://www.redcross.org.cn", title: "Red Cross Society of China" },
  { url: "https://www.chinafoundation.org", title: "China Foundation (various)" },
  { url: "https://www.ccpit.org", title: "China Council for the Promotion of International Trade (CCPIT)" },
  { url: "https://www.chinaaid.org", title: "China Aid (international cooperation)" },

  // India
  { url: "https://www.oxfamindia.org", title: "Oxfam India" },
  { url: "https://www.goonj.org", title: "Goonj (disaster relief)" },
  { url: "https://www.pratham.org", title: "Pratham (education)" },
  { url: "https://www.akanksha.org", title: "Akanksha Foundation" },
  { url: "https://www.smilefoundationindia.org", title: "Smile Foundation" },
  { url: "https://www.cry.org", title: "CRY – Child Rights and You" },
  { url: "https://www.amnesty.org.in", title: "Amnesty International India" },
  { url: "https://www.greenpeace.org.in", title: "Greenpeace India" },

  // Australia
  { url: "https://www.redcross.org.au", title: "Australian Red Cross" },
  { url: "https://www.oxfam.org.au", title: "Oxfam Australia" },
  { url: "https://www.unicef.org.au", title: "UNICEF Australia" },
  { url: "https://www.worldvision.com.au", title: "World Vision Australia" },
  { url: "https://www.greenpeace.org.au", title: "Greenpeace Australia Pacific" },
  { url: "https://www.amnesty.org.au", title: "Amnesty International Australia" },
  { url: "https://www.savechildren.org.au", title: "Save the Children Australia" },
  { url: "https://www.habitat.org.au", title: "Habitat for Humanity Australia" },

  // Canada
  { url: "https://www.redcross.ca", title: "Canadian Red Cross" },
  { url: "https://www.oxfam.ca", title: "Oxfam Canada" },
  { url: "https://www.unicef.ca", title: "UNICEF Canada" },
  { url: "https://www.amnesty.ca", title: "Amnesty International Canada" },
  { url: "https://www.doctorswithoutborders.ca", title: "Doctors Without Borders Canada" },
  { url: "https://www.habitat.ca", title: "Habitat for Humanity Canada" },
  { url: "https://www.engineerswithoutborders.ca", title: "Engineers Without Borders Canada" },

  // Singapore
  { url: "https://www.redcross.sg", title: "Singapore Red Cross" },
  { url: "https://www.communitychest.org.sg", title: "Community Chest Singapore" },
  { url: "https://www.ncss.org.sg", title: "National Council of Social Service (NCSS)" },
  { url: "https://www.beyondsocialservices.org.sg", title: "Beyond Social Services" },
  { url: "https://www.habitat.org.sg", title: "Habitat for Humanity Singapore" },

  // Netherlands
  { url: "https://www.oxfamnovib.nl", title: "Oxfam Novib" },
  { url: "https://www.msf.nl", title: "Artsen zonder Grenzen (MSF Holland)" },
  { url: "https://www.greenpeace.nl", title: "Greenpeace Nederland" },
  { url: "https://www.cordaid.nl", title: "Cordaid" },
  { url: "https://www.planinternational.nl", title: "Plan International Nederland" },
  { url: "https://www.amnesty.nl", title: "Amnesty International Netherlands" },

  // Italy
  { url: "https://www.emergency.it", title: "Emergency (humanitarian health)" },
  { url: "https://www.caritas.it", title: "Caritas Italiana" },
  { url: "https://www.savechildren.it", title: "Save the Children Italia" },
  { url: "https://www.oxfamitalia.org", title: "Oxfam Italia" },
  { url: "https://www.mediciperidirittiumani.org", title: "Medici per i Diritti Umani" },
  { url: "https://www.greenpeace.it", title: "Greenpeace Italia" },

  // Spain
  { url: "https://www.oxfamintermon.org", title: "Oxfam Intermón" },
  { url: "https://www.cruzroja.es", title: "Cruz Roja Española" },
  { url: "https://www.greenpeace.es", title: "Greenpeace España" },
  { url: "https://www.unicef.es", title: "UNICEF España" },
  { url: "https://www.msf.es", title: "Médicos Sin Fronteras España" },

  // South Korea
  { url: "https://www.redcross.or.kr", title: "Korean Red Cross" },
  { url: "https://www.worldvision.or.kr", title: "World Vision Korea" },
  { url: "https://www.goodneighbors.kr", title: "Good Neighbors Korea" },
  { url: "https://www.greenpeace.or.kr", title: "Greenpeace Korea" },
  { url: "https://www.habitat.or.kr", title: "Habitat for Humanity Korea" },

  // Greece
  { url: "https://www.redcross.gr", title: "Hellenic Red Cross" },
  { url: "https://www.greenpeace.gr", title: "Greenpeace Greece" },

  // Thailand, Mexico, UAE
  { url: "https://www.thairedcross.org", title: "Thai Red Cross Society" },
  { url: "https://www.cruzroja.org.mx", title: "Cruz Roja Mexicana" },
  { url: "https://www.redcrescent.ae", title: "UAE Red Crescent Authority" },

  // Transparency & Watchdogs (additional)
  { url: "https://www.freedomhouse.org", title: "Freedom House" },

    // Data & Statistics (new)
  // United States
  { url: "https://www.nist.gov", title: "National Institute of Standards and Technology (NIST)" },

  // China
  { url: "https://www.stats.gov.cn", title: "National Bureau of Statistics of China" },
  { url: "https://www.ceicdata.com", title: "CEIC Data (China & global economic data)" },
  { url: "https://www.chinadataonline.org", title: "China Data Online" },

  // United Kingdom
  { url: "https://www.data.gov.uk", title: "UK Open Data Portal" },
  { url: "https://www.nomisweb.co.uk", title: "NOMIS (UK labour market statistics)" },
  { url: "https://www.ukdataservice.ac.uk", title: "UK Data Service (academic datasets)" },

  // Germany
  { url: "https://www.destatis.de", title: "Destatis (Federal Statistical Office of Germany)" },
  { url: "https://www.statistik-bund.de", title: "Statistik-Bund (German statistics portal)" },
  { url: "https://www.zensus2022.de", title: "Zensus 2022 (German Census)" },

  // Japan
  { url: "https://www.e-stat.go.jp", title: "e-Stat (Japanese Government Statistics Portal)" },

  // France
  { url: "https://www.insee.fr", title: "INSEE (National Institute of Statistics and Economic Studies)" },

  // Australia
  { url: "https://www.data.gov.au", title: "Australian Open Data Portal" },

  // Canada
  { url: "https://open.canada.ca", title: "Open Government – Canada" },
  { url: "https://www.bankofcanada.ca", title: "Bank of Canada (statistics & research)" },

  // Switzerland
  { url: "https://www.bfs.admin.ch", title: "Federal Statistical Office of Switzerland (BFS)" },

  // Singapore
  { url: "https://www.singstat.gov.sg", title: "Department of Statistics Singapore" },
  { url: "https://data.gov.sg", title: "Singapore Open Data Portal" },

  // India
  { url: "https://www.mospi.gov.in", title: "Ministry of Statistics and Programme Implementation (MOSPI)" },
  { url: "https://www.censusindia.gov.in", title: "Census of India" },
  { url: "https://data.gov.in", title: "Open Government Data Platform India" },
  { url: "https://www.rbi.org.in", title: "Reserve Bank of India (statistics & publications)" },

  // Italy
  { url: "https://www.istat.it", title: "Istat (Italian National Institute of Statistics)" },
  { url: "https://www.bancaditalia.it", title: "Banca d'Italia (statistics & data)" },

  // Netherlands
  { url: "https://www.cbs.nl", title: "Statistics Netherlands (CBS)" },
  { url: "https://www.data.overheid.nl", title: "Dutch Open Data Portal" },

  // Sweden
  { url: "https://www.scb.se", title: "Statistics Sweden (SCB)" },
  { url: "https://www.statistikmyndigheten.se", title: "Swedish Statistics Agency" },
  { url: "https://www.riksbank.se", title: "Sveriges Riksbank (Statistics & Research)" },

  // Spain
  { url: "https://www.ine.es", title: "INE (Instituto Nacional de Estadística – Spain)" },
  { url: "https://datos.gob.es", title: "Datos.gob.es (Spanish Open Data)" },

  // South Korea
  { url: "https://www.data.go.kr", title: "Korea Open Data Portal" },

  // Greece
  { url: "https://www.statistics.gr", title: "Hellenic Statistical Authority (ELSTAT)" },

  // Portugal
  { url: "https://www.ine.pt", title: "Statistics Portugal (INE)" },

  // Thailand
  { url: "https://www.nso.go.th", title: "National Statistical Office of Thailand" },

  // Mexico
  { url: "https://www.inegi.org.mx", title: "INEGI (National Institute of Statistics and Geography – Mexico)" },

  // United Arab Emirates
  { url: "https://u.ae", title: "UAE Federal Statistics & Data Portal" },
  { url: "https://statistics.fcsc.gov.ae", title: "FCSC (Federal Competitiveness and Statistics Centre – UAE)" },

  // Global Aggregators (new main domains)
  { url: "https://www.ourworldindata.org", title: "Our World in Data" },
  { url: "https://www.oecd-ilibrary.org", title: "OECD iLibrary (data & publications)" },
  { url: "https://undata.un.org", title: "UNdata (United Nations Statistics)" },
  { url: "https://www.gapminder.org", title: "Gapminder (data visualizations)" },

    // Blogs & Independent Publishing (new)
  // Global Platforms & Tools
  { url: "https://www.wordpress.com", title: "WordPress.com (Blogging & CMS)" },
  { url: "https://www.wordpress.org", title: "WordPress.org (Self‑hosted CMS)" },
  { url: "https://www.blogger.com", title: "Blogger (Google) – Free Blogging" },
  { url: "https://www.ghost.org", title: "Ghost (Open‑Source Newsletter/Blog Platform)" },
  { url: "https://www.beehiiv.com", title: "Beehiiv (Newsletter Platform)" },
  { url: "https://www.buttondown.email", title: "Buttondown (Email‑first Newsletters)" },
  { url: "https://www.hashnode.com", title: "Hashnode (Developer Blogs)" },
  { url: "https://www.mirror.xyz", title: "Mirror (Web3 Publishing)" },
  { url: "https://www.carrd.co", title: "Carrd (Simple Landing‑page Sites)" },
  { url: "https://www.convertkit.com", title: "ConvertKit (Creator Newsletter Platform)" },
  { url: "https://www.mailchimp.com", title: "Mailchimp (Email Marketing & Newsletters)" },

  // United States – Notable Independent Blogs & Publications
  { url: "https://www.theatlantic.com", title: "The Atlantic (Essays & Blog Network)" },
  { url: "https://www.paulgraham.com", title: "Paul Graham (Essays)" },
  { url: "https://www.stratechery.com", title: "Stratechery (Tech & Media Analysis)" },
  { url: "https://www.theinformation.com", title: "The Information (Tech Journalism)" },
  { url: "https://www.cooltools.org", title: "Cool Tools (Recommendation Blog)" },
  { url: "https://www.kottke.org", title: "Kottke.org (Long‑running Personal Blog)" },

  // United Kingdom
  { url: "https://www.spectator.co.uk", title: "The Spectator (Opinion & Blogs)" },
  { url: "https://www.newstatesman.com", title: "New Statesman (Politics & Culture)" },

  // Germany
  { url: "https://www.zeit.de", title: "Zeit Online (Blogs & Commentary)" },
  { url: "https://www.t3n.de", title: "t3n (Tech & Digital Blog)" },
  { url: "https://www.netzpolitik.org", title: "Netzpolitik.org (Digital Rights Blog)" },

  // France
  { url: "https://www.slate.fr", title: "Slate France (Blogs & Analysis)" },
  { url: "https://www.over-blog.com", title: "OverBlog (French Blogging Platform)" },

  // Japan – Major Blogging Platforms
  { url: "https://www.note.com", title: "Note (Japanese Blogging/Newsletter Platform)" },
  { url: "https://www.ameblo.jp", title: "Ameba Blog (Ameba)" },
  { url: "https://www.hatenablog.com", title: "Hatena Blog" },
  { url: "https://blog.livedoor.com", title: "Livedoor Blog" },
  { url: "https://blogs.yahoo.co.jp", title: "Yahoo! Japan Blogs (legacy/platform)" },

  // India
  { url: "https://www.yourstory.com", title: "YourStory (Startup & Entrepreneurship Blog)" },
  { url: "https://www.inc42.com", title: "Inc42 (Indian Startup Media)" },

  // China – Blogger‑style Platforms
  { url: "https://mp.weixin.qq.com", title: "WeChat Official Accounts (WeChat Public Blogging)" },
  { url: "https://www.csdn.net", title: "CSDN (Tech Developer Blog Network)" },
  { url: "https://www.cnblogs.com", title: "CnBlogs (Developer Blogs)" },
  { url: "https://www.jianshu.com", title: "JianShu (Medium‑like Chinese Blogging)" },

  // Australia
  { url: "https://www.theconversation.com", title: "The Conversation (Academic/Expert Blogs)" },

  // Canada
  { url: "https://www.thelogic.co", title: "The Logic (Canadian Tech/Business Newsletter)" },
  { url: "https://www.betakit.com", title: "Betakit (Canadian Startup News & Blogs)" },

  // Singapore
  { url: "https://www.mothership.sg", title: "Mothership (Blog‑style News, Singapore)" },
  { url: "https://www.thesmartlocal.com", title: "TheSmartLocal (Singapore Lifestyle & Blog)" },
  { url: "https://www.vulcanpost.com", title: "Vulcan Post (Singapore/SEA Tech Blog)" },

  // South Korea – Blogging Platforms
  { url: "https://post.naver.com", title: "Naver Post (Blog‑style Posts)" },
  { url: "https://www.tistory.com", title: "Tistory (Korean Blogging Platform)" },
  { url: "https://www.egloos.com", title: "Egloos (Korean Blog Platform)" },
  { url: "https://www.brunch.co.kr", title: "Brunch (Medium‑like Korean Platform)" },

  // Italy
  { url: "https://www.ilpost.it", title: "Il Post (Italian News & Blog)" },

  // Spain
  { url: "https://www.elconfidencial.com", title: "El Confidencial (Spanish News & Blogs)" },

  // Portugal
  { url: "https://www.observador.pt", title: "Observador (Portuguese News & Blog)" },

  // Sweden
  { url: "https://www.dn.se", title: "Dagens Nyheter (Swedish News & Blogs)" },
  { url: "https://www.aftonbladet.se", title: "Aftonbladet (Swedish Newspaper & Blog)" },

  // Netherlands
  { url: "https://www.volkskrant.nl", title: "de Volkskrant (Dutch News & Blogs)" },
  { url: "https://www.nrc.nl", title: "NRC (Dutch News & Opinion)" },

  // Switzerland
  { url: "https://www.nzz.ch", title: "Neue Zürcher Zeitung (Swiss News & Blog)" },

  // Greece
  { url: "https://www.kathimerini.gr", title: "Kathimerini (Greek News & Blogs)" },

    // Books & Novels (new)
  { url: "https://www.archiveofourown.org", title: "Archive of Our Own (AO3)" },
  { url: "https://www.amazon.com/kindleunlimited", title: "Kindle Unlimited (Amazon)" },
  { url: "https://books.apple.com", title: "Apple Books" },
  { url: "https://www.smashwords.com", title: "Smashwords (Indie eBooks)" },
  { url: "https://www.manybooks.net", title: "ManyBooks (Free & Discounted eBooks)" },
  { url: "https://www.feedbooks.com", title: "Feedbooks (Public Domain & Indie)" },
  { url: "https://www.bookbub.com", title: "BookBub (Deals & Free eBooks)" },
  { url: "https://www.libbyapp.com", title: "Libby / OverDrive (Library eBooks)" },
  { url: "https://www.hoopladigital.com", title: "Hoopla Digital (Library Borrowing)" },
  { url: "https://www.radishfiction.com", title: "Radish Fiction (Serialized Stories)" },
  { url: "https://www.inkitt.com", title: "Inkitt (Discover New Authors)" },
  { url: "https://www.tapas.io", title: "Tapas (Webcomics & Novels)" },
  { url: "https://www.fictionpress.com", title: "FictionPress (Original Fiction)" },
  { url: "https://www.quotev.com", title: "Quotev (Stories & Quizzes)" },
  { url: "https://www.lulu.com", title: "Lulu (Self-Publishing & eBooks)" },
  { url: "https://www.barnesandnoble.com", title: "Barnes & Noble (eBooks)" },
  { url: "https://www.kobo.com", title: "Kobo (Rakuten eBooks)" },
  { url: "https://www.scribd.com", title: "Scribd (Subscription Books & Docs)" },
  { url: "https://www.audible.com", title: "Audible (Audiobooks)" },
  { url: "https://www.royalroad.com", title: "Royal Road (Web Serials)" },
  { url: "https://www.scribblehub.com", title: "Scribble Hub (Web Novels)" },
  { url: "https://www.webnovel.com", title: "Webnovel (Chinese Web Novels)" },
  { url: "https://www.novelupdates.com", title: "NovelUpdates (Translated Novel Aggregator)" },
  { url: "https://www.wuxiaworld.com", title: "WuxiaWorld (Cultivation Novels)" },
  { url: "https://www.gravitytales.com", title: "Gravity Tales (Translated Novels)" },
  { url: "https://www.openlibrary.org", title: "Open Library (Digital Borrowing)" },
  { url: "https://www.bookrix.com", title: "BookRix (Indie Publishing)" },
  { url: "https://www.dreame.com", title: "Dreame (Romance Web Novels)" },
  { url: "https://www.moboreader.com", title: "MoboReader (Free & Paid Novels)" },
  { url: "https://www.goodnovel.com", title: "GoodNovel (Web Novels)" },
  { url: "https://www.novelfull.com", title: "NovelFull (Aggregator)" },
  { url: "https://www.novelhall.com", title: "NovelHall (Translated Novels)" },
  { url: "https://www.librivox.org", title: "LibriVox (Free Public Domain Audiobooks)" },
  { url: "https://www.ranobelib.com", title: "Ranobelib (Russian/JP Light Novels)" },
  { url: "https://www.brandonsanderson.com", title: "Brandon Sanderson (Author Site)" },
  { url: "https://www.neilgaiman.com", title: "Neil Gaiman (Author Site)" },
  { url: "https://www.gutenberg.net.au", title: "Project Gutenberg Australia" },

    // Legal & Government Portals (new)
  // Global / International
  { url: "https://www.worldlii.org", title: "World Legal Information Institute (WorldLII)" },
  { url: "https://www.law.cornell.edu", title: "Cornell Legal Information Institute (LII)" },
  { url: "https://www.nyulawglobal.org/globalex", title: "GlobaLex (NYU) – Legal Research Guides" },
  { url: "https://guides.loc.gov/nations-world", title: "Library of Congress – Guide to Law Online" },
  { url: "https://eur-lex.europa.eu", title: "EUR-Lex (EU Law)" },
  { url: "https://www.constituteproject.org", title: "Constitute Project (World Constitutions)" },
  { url: "https://www.falm.info", title: "Free Access to Law Movement (FALM)" },
  { url: "https://www.justia.com", title: "Justia (US Law & Cases)" },
  { url: "https://www.findlaw.com", title: "FindLaw (Legal Information)" },
  { url: "https://www.courtlistener.com", title: "CourtListener (Free Legal Research)" },
  { url: "https://www.lexology.com", title: "Lexology (Legal Analysis & Updates)" },
  { url: "https://www.govinfo.gov", title: "GovInfo (US Government Publishing Office)" },
  { url: "https://www.courts.gov", title: "U.S. Courts (federal judiciary)" },
  { url: "https://www.case.law", title: "Caselaw Access Project" },
  { url: "https://www.oyez.org", title: "Oyez (Supreme Court audio & info)" },

  // Europe (specific new)
  { url: "https://curia.europa.eu", title: "CURIA (Court of Justice of the EU)" },
  { url: "https://www.gesetze-im-internet.de", title: "Gesetze im Internet (German Federal Law)" },
  { url: "https://www.bundesgerichtshof.de", title: "BGH (German Federal Court of Justice)" },
  { url: "https://www.legifrance.gouv.fr", title: "Légifrance (French Official Legislation)" },
  { url: "https://www.courdecassation.fr", title: "Cour de Cassation (France)" },
  { url: "https://www.normattiva.it", title: "Normattiva (Italian Official Legislation)" },
  { url: "https://www.cortecostituzionale.it", title: "Corte Costituzionale (Italy)" },
  { url: "https://www.boe.es", title: "BOE (Spanish Official Gazette)" },
  { url: "https://www.poderjudicial.es", title: "Poder Judicial (Spain)" },

  // Asia & Oceania (new)
  { url: "https://www.indiankanoon.org", title: "Indian Kanoon (Case Law)" },
  { url: "https://www.sci.gov.in", title: "Supreme Court of India" },
  { url: "https://www.indiacode.nic.in", title: "India Code (Legislation)" },
  { url: "https://www.npc.gov.cn", title: "National People's Congress (China – Legislation)" },
  { url: "https://www.court.gov.cn", title: "Supreme People's Court of China" },
  { url: "https://www.pkulaw.com", title: "PKULaw (China Commercial Legal Database)" },
  { url: "https://www.courts.go.jp", title: "Courts in Japan" },
  { url: "https://www.hourei.ndl.go.jp", title: "National Diet Library – Japanese Laws" },

  // Americas (new)
  { url: "https://www.stf.jus.br", title: "STF (Brazilian Supreme Court)" },
  { url: "https://www.planalto.gov.br", title: "Planalto (Brazilian Presidency/Laws)" },
  { url: "https://www.scjn.gob.mx", title: "SCJN (Mexican Supreme Court)" },
  { url: "https://www.diputados.gob.mx", title: "Cámara de Diputados (Mexico – Legislation)" },
  { url: "https://www.csjn.gov.ar", title: "CSJN (Argentine Supreme Court)" },
  { url: "https://www.infoleg.gob.ar", title: "InfoLeg (Argentina – Official Legislation)" },

  // Africa & Middle East (new)
  { url: "https://www.saflii.org", title: "SAFLII (Southern Africa Legal Information Institute)" },
  { url: "https://www.concourt.org.za", title: "Constitutional Court of South Africa" },
  { url: "https://www.kenyalaw.org", title: "Kenya Law (Legal Resources)" },
  { url: "https://www.judiciary.go.ke", title: "Judiciary of Kenya" },
  { url: "https://www.lawsofnigeria.placng.org", title: "Laws of Nigeria (PLAC)" },
  { url: "https://www.supremecourt.gov.ng", title: "Supreme Court of Nigeria" },

    // Climate & Environment (new)
  // Global Scientific & Policy Bodies
  { url: "https://www.ipcc.ch", title: "IPCC (Intergovernmental Panel on Climate Change)" },
  { url: "https://www.unep.org", title: "UN Environment Programme (UNEP)" },
  { url: "https://www.wmo.int", title: "World Meteorological Organization (WMO)" },
  { url: "https://www.iucn.org", title: "IUCN (International Union for Conservation of Nature)" },
  { url: "https://www.unfccc.int", title: "UNFCCC (Climate Change Secretariat)" },
  { url: "https://www.copernicus.eu", title: "Copernicus Climate Change Service (EU)" },

  // Global Research & Data Portals (new)
  { url: "https://www.climate.gov", title: "NOAA Climate.gov" },
  { url: "https://www.globalchange.gov", title: "U.S. Global Change Research Program" },
  { url: "https://www.carbonbrief.org", title: "Carbon Brief (Climate Science Communication)" },
  { url: "https://www.skepticalscience.com", title: "Skeptical Science" },
  { url: "https://www.realclimate.org", title: "RealClimate (Climate Scientist Blog)" },

  // Major Government Environment Ministries (new)
  { url: "https://www.eea.europa.eu", title: "European Environment Agency (EEA)" },
  { url: "https://www.metoffice.gov.uk", title: "Met Office (UK Weather & Climate)" },
  { url: "https://www.bmuv.de", title: "BMUV (German Environment Ministry)" },
  { url: "https://www.mee.gov.cn", title: "Ministry of Ecology and Environment (China)" },
  { url: "https://www.moef.gov.in", title: "MoEFCC (India Environment Ministry)" },
  { url: "https://www.environment.gov.za", title: "Department of Environment (South Africa)" },

  // Prominent NGOs & Non‑Profits (new)
  { url: "https://www.nature.org", title: "The Nature Conservancy" },
  { url: "https://www.wri.org", title: "World Resources Institute (WRI)" },
  { url: "https://www.edf.org", title: "Environmental Defense Fund (EDF)" },
  { url: "https://www.earthjustice.org", title: "Earthjustice (Environmental Law)" },
  { url: "https://www.sierraclub.org", title: "Sierra Club" },
  { url: "https://www.oceana.org", title: "Oceana (Ocean Conservation)" },
  { url: "https://www.rare.org", title: "Rare (Behavioral Conservation)" },
  { url: "https://www.catf.us", title: "Clean Air Task Force (CATF)" },
  { url: "https://www.climaterealityproject.org", title: "The Climate Reality Project" },
  { url: "https://www.arborday.org", title: "Arbor Day Foundation" },
  { url: "https://www.biologicaldiversity.org", title: "Center for Biological Diversity" },
  { url: "https://www.foei.org", title: "Friends of the Earth International (FOEI)" },
  { url: "https://www.wcs.org", title: "Wildlife Conservation Society (WCS)" },
  { url: "https://www.conservation.org", title: "Conservation International" },
  { url: "https://www.rainforestcoalition.org", title: "Rainforest Coalition" },
  { url: "https://www.350.org", title: "350.org (Climate Advocacy)" },
  { url: "https://www.climatenetwork.org", title: "Climate Action Network (CAN)" },
  { url: "https://www.earth.org", title: "Earth.org (Environmental News)" },
  { url: "https://www.cdp.net", title: "CDP (Carbon Disclosure Project)" },
  { url: "https://www.c40.org", title: "C40 Cities Climate Leadership" },
  { url: "https://www.adaptation-fund.org", title: "Adaptation Fund" },

  // Sustainability, Ecology & Specialized (new)
  { url: "https://www.iisd.org", title: "International Institute for Sustainable Development (IISD)" },
  { url: "https://www.sei.org", title: "Stockholm Environment Institute (SEI)" },
  { url: "https://www.undp.org", title: "UNDP (Environment & Climate)" },
  { url: "https://www.ipbes.net", title: "IPBES (Biodiversity Science-Policy Platform)" },
  { url: "https://www.gbif.org", title: "Global Biodiversity Information Facility (GBIF)" },
  { url: "https://www.ebird.org", title: "eBird (Citizen Science Birds)" },
  { url: "https://www.inaturalist.org", title: "iNaturalist (Citizen Science Biodiversity)" },
  { url: "https://www.globalforestwatch.org", title: "Global Forest Watch" },

  // Regional & Country Highlights (new)
  { url: "https://www.ademe.fr", title: "ADEME (French Environment & Energy Agency)" },
  { url: "https://www.gov.br/mma", title: "Ministério do Meio Ambiente (Brazil Environment Ministry)" },
  { url: "https://www.givinggreen.earth", title: "Giving Green (Climate Charity Evaluator)" },
  { url: "https://www.ecohubmap.com", title: "EcoHubMap (Environmental Directory)" },

    // Agriculture & Food (new)
  // Global Organizations & CGIAR Centers
  { url: "https://www.ifpri.org", title: "International Food Policy Research Institute (IFPRI)" },
  { url: "https://www.cgiar.org", title: "CGIAR (Global Agricultural Research Partnership)" },
  { url: "https://www.ifad.org", title: "International Fund for Agricultural Development (IFAD)" },
  { url: "https://www.codexalimentarius.org", title: "Codex Alimentarius (FAO/WHO Food Standards)" },
  { url: "https://www.globalagriculture.org", title: "Global Agriculture (Policy Analysis)" },
  { url: "https://www.iica.int", title: "Inter‑American Institute for Cooperation on Agriculture (IICA)" },
  { url: "https://www.bioversityinternational.org", title: "Bioversity International (CGIAR)" },
  { url: "https://www.irri.org", title: "International Rice Research Institute (IRRI)" },
  { url: "https://www.cimmyt.org", title: "CIMMYT (Maize and Wheat Improvement Center)" },
  { url: "https://www.icrisat.org", title: "ICRISAT (Semi‑Arid Tropics)" },
  { url: "https://www.alliancebioversityciat.org", title: "Alliance of Bioversity International and CIAT" },
  { url: "https://www.ilri.org", title: "International Livestock Research Institute (ILRI)" },
  { url: "https://www.worldfishcenter.org", title: "WorldFish (Aquatic Food Systems)" },
  { url: "https://www.cipotato.org", title: "International Potato Center (CIP)" },
  { url: "https://www.iita.org", title: "International Institute of Tropical Agriculture (IITA)" },

  // Government Ministries & Agencies
  { url: "https://www.bmel.de", title: "BMEL (German Federal Ministry of Food and Agriculture)" },
  { url: "https://www.agriculture.gouv.fr", title: "Ministère de l'Agriculture et de la Souveraineté alimentaire (France)" },
  { url: "https://www.politicheagricole.it", title: "Ministero dell'Agricoltura, della Sovranità alimentare e delle Foreste (Italy)" },
  { url: "https://www.moa.gov.cn", title: "Ministry of Agriculture and Rural Affairs (China)" },
  { url: "https://www.agricoop.nic.in", title: "Department of Agriculture & Farmers Welfare (India)" },
  { url: "https://www.dac.gov.in", title: "Department of Agriculture, Cooperation & Farmers Welfare (India)" },
  { url: "https://www.icar.org.in", title: "Indian Council of Agricultural Research (ICAR)" },
  { url: "https://www.maf.govt.nz", title: "Ministry for Primary Industries (New Zealand)" },
  { url: "https://www.agriculture.canada.ca", title: "Agriculture and Agri‑Food Canada" },
  { url: "https://www.agricultura.gov.br", title: "Ministério da Agricultura e Pecuária (Brazil)" },
  { url: "https://www.embrapa.br", title: "EMBRAPA (Brazilian Agricultural Research Corporation)" },
  { url: "https://www.gob.mx/agricultura", title: "Secretaría de Agricultura y Desarrollo Rural (Mexico)" },
  { url: "https://www.kilimo.go.ke", title: "Ministry of Agriculture and Livestock Development (Kenya)" },
  { url: "https://www.au.int", title: "African Union (Agriculture and Food Security Programs)" },

  // Research Institutes & Universities
  { url: "https://www.wageningenur.nl", title: "Wageningen University & Research (Netherlands)" },
  { url: "https://www.rothamsted.ac.uk", title: "Rothamsted Research (UK – Agricultural Science)" },
  { url: "https://www.jircas.go.jp", title: "Japan International Research Center for Agricultural Sciences (JIRCAS)" },
  { url: "https://www.ucdavis.edu", title: "University of California, Davis (Agriculture & Food Programs)" },
  { url: "https://www.iastate.edu", title: "Iowa State University (Agriculture & Life Sciences)" },
  { url: "https://www.cirad.fr", title: "CIRAD (French Agricultural Research for Development)" },
  { url: "https://www.inrae.fr", title: "INRAE (French National Research Institute for Agriculture, Food and Environment)" },

  // Data & Statistics Portals
  { url: "https://www.globalhungerindex.org", title: "Global Hunger Index" },
  { url: "https://www.harvestchoice.org", title: "HarvestChoice (Agricultural Data & Tools)" },
  { url: "https://www.earthstat.org", title: "EarthStat (Crop Production and Land Use Data)" },
  { url: "https://www.ippc.int", title: "International Plant Protection Convention (IPPC)" },
  { url: "https://www.woah.org", title: "World Organisation for Animal Health (WOAH, formerly OIE)" },

  // NGOs, Advocacy & Sustainability
  { url: "https://www.actionagainsthunger.org", title: "Action Against Hunger (ACF)" },
  { url: "https://www.heifer.org", title: "Heifer International (Livestock & Development)" },
  { url: "https://www.slowfood.com", title: "Slow Food (Food Culture & Biodiversity)" },
  { url: "https://www.slowfoodfoundation.com", title: "Slow Food Foundation" },
  { url: "https://www.viacampesina.org", title: "La Vía Campesina (Peasant Rights & Food Sovereignty)" },
  { url: "https://www.ifoam.bio", title: "IFOAM – Organics International" },
  { url: "https://www.rodaleinstitute.org", title: "Rodale Institute (Regenerative Organic Agriculture)" },
  { url: "https://www.soilhealthinstitute.org", title: "Soil Health Institute" },
  { url: "https://www.rainforest-alliance.org", title: "Rainforest Alliance (Sustainable Agriculture)" },
  { url: "https://www.rspo.org", title: "Roundtable on Sustainable Palm Oil (RSPO)" },
  { url: "https://www.fairtrade.net", title: "Fairtrade International" },
  { url: "https://www.seedsavers.org", title: "Seed Savers Exchange (Heirloom Varieties)" },
  { url: "https://www.globalnutritionreport.org", title: "Global Nutrition Report" },
  { url: "https://www.nutrition.org", title: "American Society for Nutrition (Global Nutrition Science)" },
  { url: "https://www.scalingupnutrition.org", title: "Scaling Up Nutrition (SUN) Movement" },

  // Trade & Related
  { url: "https://www.wto.org", title: "World Trade Organization (WTO – Agriculture)" },

    // Transportation & Automotive (new)
  // Global Organizations & Associations
  { url: "https://www.icao.int", title: "International Civil Aviation Organization (ICAO)" },
  { url: "https://www.iata.org", title: "International Air Transport Association (IATA)" },
  { url: "https://www.unece.org", title: "UNECE – Transport Division (Vehicle Regulations)" },
  { url: "https://www.imo.org", title: "International Maritime Organization (IMO)" },
  { url: "https://www.irf.global", title: "International Road Federation (IRF)" },
  { url: "https://www.uitp.org", title: "International Association of Public Transport (UITP)" },
  { url: "https://www.oica.net", title: "International Organization of Motor Vehicle Manufacturers (OICA)" },
  { url: "https://www.acea.auto", title: "European Automobile Manufacturers' Association (ACEA)" },
  { url: "https://www.weforum.org", title: "World Economic Forum – Mobility & Future of Transportation" },

  // Government Regulatory Agencies (new)
  { url: "https://www.nhtsa.gov", title: "NHTSA (National Highway Traffic Safety Administration – US)" },
  { url: "https://www.easa.europa.eu", title: "European Union Aviation Safety Agency (EASA)" },
  { url: "https://transport.ec.europa.eu", title: "EU Mobility & Transport (European Commission)" },
  { url: "https://www.tc.gc.ca", title: "Transport Canada" },

  // Major Automotive Manufacturers
  { url: "https://www.tesla.com", title: "Tesla" },
  { url: "https://www.toyota.com", title: "Toyota" },
  { url: "https://www.toyota-global.com", title: "Toyota Global" },
  { url: "https://www.ford.com", title: "Ford" },
  { url: "https://www.gm.com", title: "General Motors" },
  { url: "https://www.volkswagen.com", title: "Volkswagen" },
  { url: "https://www.bmw.com", title: "BMW" },
  { url: "https://www.mercedes-benz.com", title: "Mercedes‑Benz" },
  { url: "https://www.honda.com", title: "Honda" },
  { url: "https://www.hyundai.com", title: "Hyundai" },
  { url: "https://www.kia.com", title: "Kia" },
  { url: "https://www.byd.com", title: "BYD (Build Your Dreams)" },
  { url: "https://www.rivian.com", title: "Rivian" },
  { url: "https://www.lucidmotors.com", title: "Lucid Motors" },
  { url: "https://www.nissan-global.com", title: "Nissan Global" },
  { url: "https://www.mazda.com", title: "Mazda" },
  { url: "https://www.subaru.com", title: "Subaru" },
  { url: "https://www.stellantis.com", title: "Stellantis (Peugeot, Fiat, etc.)" },
  { url: "https://www.renault.com", title: "Renault" },
  { url: "https://www.ferrari.com", title: "Ferrari" },
  { url: "https://www.porsche.com", title: "Porsche" },
  { url: "https://www.tata.com/motors", title: "Tata Motors" },
  { url: "https://www.mahindra.com", title: "Mahindra & Mahindra" },
  { url: "https://www.marutisuzuki.com", title: "Maruti Suzuki" },

  // Aviation & Aerospace (new)
  { url: "https://www.airbus.com", title: "Airbus" },
  { url: "https://www.boeing.com", title: "Boeing" },
  { url: "https://www.embraer.com", title: "Embraer" },
  { url: "https://www.bombardier.com", title: "Bombardier" },
  { url: "https://www.safran-group.com", title: "Safran (Aerospace Engines & Equipment)" },
  { url: "https://www.rolls-royce.com", title: "Rolls‑Royce (Aerospace)" },

  // Logistics, Shipping & Freight
  { url: "https://www.ups.com", title: "UPS" },
  { url: "https://www.fedex.com", title: "FedEx" },
  { url: "https://www.dhl.com", title: "DHL" },
  { url: "https://www.maersk.com", title: "Maersk (Shipping & Logistics)" },
  { url: "https://www.cma-cgm.com", title: "CMA CGM (Container Shipping)" },
  { url: "https://www.msc.com", title: "Mediterranean Shipping Company (MSC)" },
  { url: "https://www.xpo.com", title: "XPO Logistics" },
  { url: "https://www.jbhunt.com", title: "J.B. Hunt (Trucking & Logistics)" },
  { url: "https://www.unionpacific.com", title: "Union Pacific Railroad" },
  { url: "https://www.db.de", title: "Deutsche Bahn (German Railways)" },
  { url: "https://www.fiata.com", title: "FIATA (International Freight Forwarders)" },

  // Infrastructure, Charging & Research
  { url: "https://www.chargepoint.com", title: "ChargePoint (EV Charging Network)" },
  { url: "https://www.electrifyamerica.com", title: "Electrify America (EV Charging)" },
  { url: "https://www.itf-oecd.org", title: "International Transport Forum (ITF – OECD)" },
  { url: "https://www.nrel.gov", title: "National Renewable Energy Laboratory (NREL – Transportation)" },

  // Commercial Vehicles, Motorcycles, Tires & Auto Parts
  { url: "https://www.daimlertruck.com", title: "Daimler Truck" },
  { url: "https://www.volvo.com", title: "Volvo Group (Trucks & Buses)" },
  { url: "https://www.caterpillar.com", title: "Caterpillar (Heavy Equipment)" },
  { url: "https://www.harley-davidson.com", title: "Harley‑Davidson (Motorcycles)" },
  { url: "https://www.michelin.com", title: "Michelin (Tires)" },
  { url: "https://www.bridgestone.com", title: "Bridgestone (Tires)" },
  { url: "https://www.goodyear.com", title: "Goodyear (Tires)" },
  { url: "https://www.bosch.com", title: "Bosch (Auto Parts & Technology)" },
  { url: "https://www.continental.com", title: "Continental (Auto Parts & Tires)" },
  { url: "https://www.denso.com", title: "Denso (Automotive Components)" },
  { url: "https://www.nio.com", title: "NIO (Electric Vehicles)" },
  { url: "https://www.xpeng.com", title: "XPeng (Smart EVs)" },
  { url: "https://www.polestar.com", title: "Polestar (Electric Performance Cars)" },
  // add more as needed
];