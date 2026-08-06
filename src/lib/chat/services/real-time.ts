// src/lib/services/real-time.ts

// A reliable city‑to‑timezone map (can be extended, but Open‑Meteo will catch the rest)
const HARDCODED_TIMEZONES: Record<string, string> = {
  // Pakistan
  lahore: "Asia/Karachi",
  karachi: "Asia/Karachi",
  islamabad: "Asia/Karachi",
  faisalabad: "Asia/Karachi",
  rawalpindi: "Asia/Karachi",
  multan: "Asia/Karachi",
  gujranwala: "Asia/Karachi",
  peshawar: "Asia/Karachi",
  quetta: "Asia/Karachi",
  sialkot: "Asia/Karachi",
  hyderabad_pakistan: "Asia/Karachi",
  sukkur: "Asia/Karachi",
  bahawalpur: "Asia/Karachi",
  sargodha: "Asia/Karachi",
  larkana: "Asia/Karachi",
  
  // India
  mumbai: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  bangalore: "Asia/Kolkata",
  chennai: "Asia/Kolkata",
  kolkata: "Asia/Kolkata",
  hyderabad: "Asia/Kolkata",
  pune: "Asia/Kolkata",
  ahmedabad: "Asia/Kolkata",
  jaipur: "Asia/Kolkata",
  lucknow: "Asia/Kolkata",
  surat: "Asia/Kolkata",
  nagpur: "Asia/Kolkata",
  indore: "Asia/Kolkata",
  bhopal: "Asia/Kolkata",
  visakhapatnam: "Asia/Kolkata",
  patna: "Asia/Kolkata",
  vadodara: "Asia/Kolkata",
  ludhiana: "Asia/Kolkata",
  agra: "Asia/Kolkata",
  varanasi: "Asia/Kolkata",
  
  // USA
  "new york": "America/New_York",
  "los angeles": "America/Los_Angeles",
  chicago: "America/Chicago",
  houston: "America/Chicago",
  phoenix: "America/Phoenix",
  philadelphia: "America/New_York",
  "san antonio": "America/Chicago",
  "san diego": "America/Los_Angeles",
  dallas: "America/Chicago",
  "san jose": "America/Los_Angeles",
  austin: "America/Chicago",
  jacksonville: "America/New_York",
  "san francisco": "America/Los_Angeles",
  columbus: "America/New_York",
  indianapolis: "America/Indiana/Indianapolis",
  "fort worth": "America/Chicago",
  charlotte: "America/New_York",
  seattle: "America/Los_Angeles",
  denver: "America/Denver",
  boston: "America/New_York",
  washington: "America/New_York",
  miami: "America/New_York",
  atlanta: "America/New_York",
  detroit: "America/Detroit",
  portland: "America/Los_Angeles",
  "las vegas": "America/Los_Angeles",
  nashville: "America/Chicago",
  baltimore: "America/New_York",
  milwaukee: "America/Chicago",
  albuquerque: "America/Denver",
  tucson: "America/Phoenix",
  fresno: "America/Los_Angeles",
  sacramento: "America/Los_Angeles",
  mesa: "America/Phoenix",
  toronto: "America/Toronto",
  vancouver: "America/Vancouver",
  montreal: "America/Montreal",
  
  // UK
  london: "Europe/London",
  manchester: "Europe/London",
  birmingham: "Europe/London",
  leeds: "Europe/London",
  glasgow: "Europe/London",
  liverpool: "Europe/London",
  bristol: "Europe/London",
  sheffield: "Europe/London",
  edinburgh: "Europe/London",
  newcastle: "Europe/London",
  nottingham: "Europe/London",
  belfast: "Europe/London",
  cardiff: "Europe/London",
  
  // Europe
  paris: "Europe/Paris",
  berlin: "Europe/Berlin",
  madrid: "Europe/Madrid",
  rome: "Europe/Rome",
  amsterdam: "Europe/Amsterdam",
  brussels: "Europe/Brussels",
  vienna: "Europe/Vienna",
  prague: "Europe/Prague",
  warsaw: "Europe/Warsaw",
  budapest: "Europe/Budapest",
  bucharest: "Europe/Bucharest",
  athens: "Europe/Athens",
  lisbon: "Europe/Lisbon",
  dublin: "Europe/Dublin",
  oslo: "Europe/Oslo",
  stockholm: "Europe/Stockholm",
  copenhagen: "Europe/Copenhagen",
  helsinki: "Europe/Helsinki",
  zurich: "Europe/Zurich",
  geneva: "Europe/Zurich",
  // France
  lyon: "Europe/Paris",
  marseille: "Europe/Paris",
  toulouse: "Europe/Paris",
  nice: "Europe/Paris",
  nantes: "Europe/Paris",
  // Germany
  hamburg: "Europe/Berlin",
  munich: "Europe/Berlin",
  cologne: "Europe/Berlin",
  frankfurt: "Europe/Berlin",
  stuttgart: "Europe/Berlin",
  // Spain
  barcelona: "Europe/Madrid",
  valencia: "Europe/Madrid",
  seville: "Europe/Madrid",
  zaragoza: "Europe/Madrid",
  malaga: "Europe/Madrid",
  // Italy
  milan: "Europe/Rome",
  naples: "Europe/Rome",
  turin: "Europe/Rome",
  palermo: "Europe/Rome",
  florence: "Europe/Rome",
  // Netherlands
  rotterdam: "Europe/Amsterdam",
  "the hague": "Europe/Amsterdam",
  utrecht: "Europe/Amsterdam",
  // Belgium
  antwerp: "Europe/Brussels",
  ghent: "Europe/Brussels",
  charleroi: "Europe/Brussels",
  // Austria
  graz: "Europe/Vienna",
  linz: "Europe/Vienna",
  salzburg: "Europe/Vienna",
  // Czechia
  brno: "Europe/Prague",
  ostrava: "Europe/Prague",
  // Poland
  krakow: "Europe/Warsaw",
  lodz: "Europe/Warsaw",
  wroclaw: "Europe/Warsaw",
  poznan: "Europe/Warsaw",
  gdansk: "Europe/Warsaw",
  // Hungary
  debrecen: "Europe/Budapest",
  szeged: "Europe/Budapest",
  miskolc: "Europe/Budapest",
  // Romania
  cluj: "Europe/Bucharest",
  timisoara: "Europe/Bucharest",
  iasi: "Europe/Bucharest",
  constanta: "Europe/Bucharest",
  // Greece
  thessaloniki: "Europe/Athens",
  patras: "Europe/Athens",
  // Portugal
  porto: "Europe/Lisbon",
  braga: "Europe/Lisbon",
  coimbra: "Europe/Lisbon",
  // Ireland
  cork: "Europe/Dublin",
  limerick: "Europe/Dublin",
  galway: "Europe/Dublin",
  // Norway
  bergen: "Europe/Oslo",
  trondheim: "Europe/Oslo",
  stavanger: "Europe/Oslo",
  // Sweden
  gothenburg: "Europe/Stockholm",
  malmo: "Europe/Stockholm",
  uppsala: "Europe/Stockholm",
  // Denmark
  aarhus: "Europe/Copenhagen",
  odense: "Europe/Copenhagen",
  aalborg: "Europe/Copenhagen",
  // Finland
  espoo: "Europe/Helsinki",
  tampere: "Europe/Helsinki",
  turku: "Europe/Helsinki",
  oulu: "Europe/Helsinki",
  // Switzerland
  basel: "Europe/Zurich",
  lausanne: "Europe/Zurich",
  bern: "Europe/Zurich",
  lucerne: "Europe/Zurich",
  
  // Middle East
  dubai: "Asia/Dubai",
  "abu dhabi": "Asia/Dubai",
  sharjah: "Asia/Dubai",
  "al ain": "Asia/Dubai",
  riyadh: "Asia/Riyadh",
  jeddah: "Asia/Riyadh",
  mecca: "Asia/Riyadh",
  medina: "Asia/Riyadh",
  dammam: "Asia/Riyadh",
  doha: "Asia/Qatar",
  "al rayyan": "Asia/Qatar",
  "kuwait city": "Asia/Kuwait",
  "al jahra": "Asia/Kuwait",
  manama: "Asia/Bahrain",
  riffa: "Asia/Bahrain",
  muscat: "Asia/Muscat",
  salalah: "Asia/Muscat",
  "tel aviv": "Asia/Jerusalem",
  jerusalem: "Asia/Jerusalem",
  haifa: "Asia/Jerusalem",
  "rishon lezion": "Asia/Jerusalem",
  netanya: "Asia/Jerusalem",
  
  // Asia
  tokyo: "Asia/Tokyo",
  osaka: "Asia/Tokyo",
  nagoya: "Asia/Tokyo",
  sapporo: "Asia/Tokyo",
  fukuoka: "Asia/Tokyo",
  yokohama: "Asia/Tokyo",
  seoul: "Asia/Seoul",
  busan: "Asia/Seoul",
  incheon: "Asia/Seoul",
  daegu: "Asia/Seoul",
  daejeon: "Asia/Seoul",
  gwangju: "Asia/Seoul",
  beijing: "Asia/Shanghai",
  shanghai: "Asia/Shanghai",
  guangzhou: "Asia/Shanghai",
  shenzhen: "Asia/Shanghai",
  tianjin: "Asia/Shanghai",
  chongqing: "Asia/Shanghai",
  nanjing: "Asia/Shanghai",
  wuhan: "Asia/Shanghai",
  "hong kong": "Asia/Hong_Kong",
  singapore: "Asia/Singapore",
  bangkok: "Asia/Bangkok",
  nonthaburi: "Asia/Bangkok",
  "chiang mai": "Asia/Bangkok",
  pattaya: "Asia/Bangkok",
  "kuala lumpur": "Asia/Kuala_Lumpur",
  "johor bahru": "Asia/Kuala_Lumpur",
  ipoh: "Asia/Kuala_Lumpur",
  kuching: "Asia/Kuching",
  jakarta: "Asia/Jakarta",
  surabaya: "Asia/Jakarta",
  bandung: "Asia/Jakarta",
  medan: "Asia/Jakarta",
  semarang: "Asia/Jakarta",
  manila: "Asia/Manila",
  "quezon city": "Asia/Manila",
  davao: "Asia/Manila",
  cebu: "Asia/Manila",
  "ho chi minh": "Asia/Ho_Chi_Minh",
  hanoi: "Asia/Ho_Chi_Minh",
  "da nang": "Asia/Ho_Chi_Minh",
  taipei: "Asia/Taipei",
  kaohsiung: "Asia/Taipei",
  taichung: "Asia/Taipei",
  tainan: "Asia/Taipei",
  
  // Australia
  sydney: "Australia/Sydney",
  melbourne: "Australia/Melbourne",
  brisbane: "Australia/Brisbane",
  perth: "Australia/Perth",
  adelaide: "Australia/Adelaide",
  canberra: "Australia/Sydney",
  "gold coast": "Australia/Brisbane",
  newcastle_australia: "Australia/Sydney",
  wollongong: "Australia/Sydney",
  geelong: "Australia/Melbourne",
  hobart: "Australia/Hobart",
  darwin: "Australia/Darwin",
  auckland: "Pacific/Auckland",
  wellington: "Pacific/Auckland",
  christchurch: "Pacific/Auckland",
  hamilton: "Pacific/Auckland",
  tauranga: "Pacific/Auckland",
  
  // Africa
  cairo: "Africa/Cairo",
  alexandria: "Africa/Cairo",
  giza: "Africa/Cairo",
  "port said": "Africa/Cairo",
  lagos: "Africa/Lagos",
  abuja: "Africa/Lagos",
  kano: "Africa/Lagos",
  ibadan: "Africa/Lagos",
  nairobi: "Africa/Nairobi",
  mombasa: "Africa/Nairobi",
  kisumu: "Africa/Nairobi",
  johannesburg: "Africa/Johannesburg",
  "cape town": "Africa/Johannesburg",
  durban: "Africa/Johannesburg",
  pretoria: "Africa/Johannesburg",
  bloemfontein: "Africa/Johannesburg",
  casablanca: "Africa/Casablanca",
  rabat: "Africa/Casablanca",
  fes: "Africa/Casablanca",
  marrakech: "Africa/Casablanca",
  tangier: "Africa/Casablanca",
  
  // South America
  "sao paulo": "America/Sao_Paulo",
  "rio de janeiro": "America/Sao_Paulo",
  salvador: "America/Bahia",
  fortaleza: "America/Fortaleza",
  brasilia: "America/Sao_Paulo",
  "belo horizonte": "America/Sao_Paulo",
  manaus: "America/Manaus",
  curitiba: "America/Sao_Paulo",
  recife: "America/Recife",
  "porto alegre": "America/Sao_Paulo",
  belem: "America/Belem",
  goiania: "America/Sao_Paulo",
  "buenos aires": "America/Argentina/Buenos_Aires",
  cordoba: "America/Argentina/Buenos_Aires",
  rosario: "America/Argentina/Buenos_Aires",
  mendoza: "America/Argentina/Buenos_Aires",
  lima: "America/Lima",
  arequipa: "America/Lima",
  trujillo: "America/Lima",
  bogota: "America/Bogota",
  medellin: "America/Bogota",
  cali: "America/Bogota",
  barranquilla: "America/Bogota",
  santiago: "America/Santiago",
  valparaiso: "America/Santiago",
  concepcion: "America/Santiago",
  caracas: "America/Caracas",
  maracaibo: "America/Caracas",
  valencia_venezuela: "America/Caracas",
  
  // Central America
  "mexico city": "America/Mexico_City",
  guadalajara: "America/Mexico_City",
  monterrey: "America/Monterrey",
  puebla: "America/Mexico_City",
  leon: "America/Mexico_City",
  tijuana: "America/Tijuana",
  "ciudad juarez": "America/Ciudad_Juarez",
  merida: "America/Merida",
  cancun: "America/Cancun",
  queretaro: "America/Mexico_City",
  "san luis potosi": "America/Mexico_City",
  
  // Others
  moscow: "Europe/Moscow",
  "st petersburg": "Europe/Moscow",
  "nizhny novgorod": "Europe/Moscow",
  kazan: "Europe/Moscow",
  "rostov-on-don": "Europe/Moscow",
  novosibirsk: "Asia/Novosibirsk",
  yekaterinburg: "Asia/Yekaterinburg",
  istanbul: "Europe/Istanbul",
  ankara: "Europe/Istanbul",
  izmir: "Europe/Istanbul",
  bursa: "Europe/Istanbul",
  adana: "Europe/Istanbul",
  antalya: "Europe/Istanbul",

    // Afghanistan
  kabul: "Asia/Kabul",
  kandahar: "Asia/Kabul",
  herat: "Asia/Kabul",
  mazar_i_sharif: "Asia/Kabul",
  jalalabad: "Asia/Kabul",
  kunduz: "Asia/Kabul",
  ghazni: "Asia/Kabul",
  bamyan: "Asia/Kabul",
  lashkargah: "Asia/Kabul",
  taloqan: "Asia/Kabul",

  // Albania
  tirana: "Europe/Tirane",
  durres: "Europe/Tirane",
  vlore: "Europe/Tirane",
  elbasan: "Europe/Tirane",
  shkoder: "Europe/Tirane",
  fier: "Europe/Tirane",
  korce: "Europe/Tirane",
  berat: "Europe/Tirane",
  lushnje: "Europe/Tirane",
  kavaje: "Europe/Tirane",

  // Algeria
  algiers: "Africa/Algiers",
  oran: "Africa/Algiers",
  constantine: "Africa/Algiers",
  annaba: "Africa/Algiers",
  batna: "Africa/Algiers",
  setif: "Africa/Algiers",
  sidi_bel_abbes: "Africa/Algiers",
  biskra: "Africa/Algiers",
  tebessa: "Africa/Algiers",
  blida: "Africa/Algiers",

  // Andorra
  andorra_la_vella: "Europe/Andorra",
  escaldes_engordany: "Europe/Andorra",
  encamp: "Europe/Andorra",
  sant_julia_de_loria: "Europe/Andorra",
  la_massana: "Europe/Andorra",

  // Angola
  luanda: "Africa/Luanda",
  huambo: "Africa/Luanda",
  lobito: "Africa/Luanda",
  benguela: "Africa/Luanda",
  kuito: "Africa/Luanda",
  lubango: "Africa/Luanda",
  malanje: "Africa/Luanda",
  namibe: "Africa/Luanda",
  soyo: "Africa/Luanda",
  cabinda: "Africa/Luanda",

  // Antigua and Barbuda
  "st. john's": "America/Antigua",
  all_saints: "America/Antigua",
  liberta: "America/Antigua",
  potters_village: "America/Antigua",
  bolans: "America/Antigua",

  // Armenia
  yerevan: "Asia/Yerevan",
  gyumri: "Asia/Yerevan",
  vanadzor: "Asia/Yerevan",
  vagharshapat: "Asia/Yerevan",
  hrazdan: "Asia/Yerevan",
  abovyan: "Asia/Yerevan",
  kapan: "Asia/Yerevan",
  armavir: "Asia/Yerevan",
  artashat: "Asia/Yerevan",
  gavar: "Asia/Yerevan",

  // Azerbaijan
  baku: "Asia/Baku",
  ganja: "Asia/Baku",
  sumqayit: "Asia/Baku",
  mingachevir: "Asia/Baku",
  lankaran: "Asia/Baku",
  shirvan: "Asia/Baku",
  nakhchivan: "Asia/Baku",
  shamkir: "Asia/Baku",
  khirdalan: "Asia/Baku",
  yevlakh: "Asia/Baku",

  // Bahamas
  nassau: "America/Nassau",
  freeport: "America/Nassau",
  marsh_harbour: "America/Nassau",
  west_end: "America/Nassau",
  coopers_town: "America/Nassau",

    // Bangladesh
  dhaka: "Asia/Dhaka",
  chittagong: "Asia/Dhaka",
  khulna: "Asia/Dhaka",
  rajshahi: "Asia/Dhaka",
  sylhet: "Asia/Dhaka",
  barisal: "Asia/Dhaka",
  rangpur: "Asia/Dhaka",
  mymensingh: "Asia/Dhaka",
  comilla: "Asia/Dhaka",
  narayanganj: "Asia/Dhaka",

  // Barbados
  bridgetown: "America/Barbados",
  speightstown: "America/Barbados",
  oistins: "America/Barbados",
  bathsheba: "America/Barbados",
  holetown: "America/Barbados",

  // Belarus
  minsk: "Europe/Minsk",
  gomel: "Europe/Minsk",
  mogilev: "Europe/Minsk",
  vitebsk: "Europe/Minsk",
  grodno: "Europe/Minsk",
  brest: "Europe/Minsk",
  babruysk: "Europe/Minsk",
  baranavichy: "Europe/Minsk",
  borisov: "Europe/Minsk",
  pinsk: "Europe/Minsk",

  // Belize
  belize_city: "America/Belize",
  belmopan: "America/Belize",
  san_ignacio: "America/Belize",
  orange_walk: "America/Belize",
  dangriga: "America/Belize",
  corozal: "America/Belize",
  san_pedro: "America/Belize",

  // Benin
  cotonou: "Africa/Porto-Novo",
  porto_novo: "Africa/Porto-Novo",
  parakou: "Africa/Porto-Novo",
  djougou: "Africa/Porto-Novo",
  bohol: "Africa/Porto-Novo",
  kandi: "Africa/Porto-Novo",
  abomey_calavi: "Africa/Porto-Novo",
  natitingou: "Africa/Porto-Novo",
  lokossa: "Africa/Porto-Novo",
  ouidah: "Africa/Porto-Novo",

  // Bhutan
  thimphu: "Asia/Thimphu",
  phuntsholing: "Asia/Thimphu",
  paro: "Asia/Thimphu",
  gelephu: "Asia/Thimphu",
  samdrup_jongkhar: "Asia/Thimphu",
  wangdue_phodrang: "Asia/Thimphu",
  punakha: "Asia/Thimphu",
  trongsa: "Asia/Thimphu",

  // Bolivia
  santa_cruz: "America/La_Paz",
  el_alto: "America/La_Paz",
  la_paz: "America/La_Paz",
  cochabamba: "America/La_Paz",
  sucre: "America/La_Paz",
  oruro: "America/La_Paz",
  tarija: "America/La_Paz",
  potosi: "America/La_Paz",
  sacaba: "America/La_Paz",
  montero: "America/La_Paz",

  // Bosnia and Herzegovina
  sarajevo: "Europe/Sarajevo",
  banja_luka: "Europe/Sarajevo",
  tuzla: "Europe/Sarajevo",
  zenica: "Europe/Sarajevo",
  mostar: "Europe/Sarajevo",
  bijeljina: "Europe/Sarajevo",
  brcko: "Europe/Sarajevo",
  prijedor: "Europe/Sarajevo",
  doboj: "Europe/Sarajevo",
  trebinje: "Europe/Sarajevo",

  // Botswana
  gaborone: "Africa/Gaborone",
  francistown: "Africa/Gaborone",
  molepolole: "Africa/Gaborone",
  maun: "Africa/Gaborone",
  serowe: "Africa/Gaborone",
  kanye: "Africa/Gaborone",
  mahalapye: "Africa/Gaborone",
  palapye: "Africa/Gaborone",
  selibe_phikwe: "Africa/Gaborone",
  kasane: "Africa/Gaborone",

  // Brunei
  bandar_seri_begawan: "Asia/Brunei",
  kuala_belait: "Asia/Brunei",
  seria: "Asia/Brunei",
  tutong: "Asia/Brunei",
  bangar: "Asia/Brunei",

  // Bulgaria
  sofia: "Europe/Sofia",
  plovdiv: "Europe/Sofia",
  varna: "Europe/Sofia",
  burgas: "Europe/Sofia",
  ruse: "Europe/Sofia",
  stara_zagora: "Europe/Sofia",
  pleven: "Europe/Sofia",
  dobrich: "Europe/Sofia",
  sliven: "Europe/Sofia",
  shumen: "Europe/Sofia",

  // Burkina Faso
  ouagadougou: "Africa/Ouagadougou",
  bobo_dioulasso: "Africa/Ouagadougou",
  koudougou: "Africa/Ouagadougou",
  ouahigouya: "Africa/Ouagadougou",
  banfora: "Africa/Ouagadougou",
  dedougou: "Africa/Ouagadougou",
  kaya: "Africa/Ouagadougou",
  tenkodogo: "Africa/Ouagadougou",
  fada_ngourma: "Africa/Ouagadougou",
  hounde: "Africa/Ouagadougou",

  // Burundi
  bujumbura: "Africa/Bujumbura",
  gitega: "Africa/Bujumbura",
  mwaro: "Africa/Bujumbura",
  ngozi: "Africa/Bujumbura",
  ruyigi: "Africa/Bujumbura",
  kayanza: "Africa/Bujumbura",
  bururi: "Africa/Bujumbura",
  muramvya: "Africa/Bujumbura",
  makamba: "Africa/Bujumbura",
  rumonge: "Africa/Bujumbura",

    // Cabo Verde
  praia: "Atlantic/Cape_Verde",
  mindelo: "Atlantic/Cape_Verde",
  santa_maria: "Atlantic/Cape_Verde",
  assomada: "Atlantic/Cape_Verde",
  pedra_badejo: "Atlantic/Cape_Verde",
  sao_filipe: "Atlantic/Cape_Verde",
  porto_novo_cape_verde: "Atlantic/Cape_Verde",
  ribeira_brava: "Atlantic/Cape_Verde",
  tarrafal: "Atlantic/Cape_Verde",

  // Cambodia
  phnom_penh: "Asia/Phnom_Penh",
  siem_reap: "Asia/Phnom_Penh",
  battambang: "Asia/Phnom_Penh",
  sihanoukville: "Asia/Phnom_Penh",
  poipet: "Asia/Phnom_Penh",
  kampong_cham: "Asia/Phnom_Penh",
  kampot: "Asia/Phnom_Penh",
  pursat: "Asia/Phnom_Penh",
  takeo: "Asia/Phnom_Penh",
  kratie: "Asia/Phnom_Penh",

  // Cameroon
  douala: "Africa/Douala",
  yaounde: "Africa/Douala",
  bamenda: "Africa/Douala",
  bafoussam: "Africa/Douala",
  maroua: "Africa/Douala",
  garoua: "Africa/Douala",
  ngaoundere: "Africa/Douala",
  kumba: "Africa/Douala",
  limbe: "Africa/Douala",
  edea: "Africa/Douala",

  // Canada
  toronto_canada: "America/Toronto",
  montreal_canada: "America/Montreal",
  vancouver_canada: "America/Vancouver",
  calgary: "America/Edmonton",
  edmonton: "America/Edmonton",
  ottawa: "America/Toronto",
  winnipeg: "America/Winnipeg",
  quebec_city: "America/Montreal",
  hamilton_canada: "America/Toronto",
  kitchener: "America/Toronto",
  london_canada: "America/Toronto",
  halifax: "America/Halifax",
  victoria: "America/Vancouver",
  saskatoon: "America/Regina",
  regina: "America/Regina",
  st_johns: "America/St_Johns",

  // Central African Republic
  bangui: "Africa/Bangui",
  bimbo: "Africa/Bangui",
  berberati: "Africa/Bangui",
  carnott: "Africa/Bangui",
  bambari: "Africa/Bangui",
  bouar: "Africa/Bangui",
  bossangoa: "Africa/Bangui",
  mobaye: "Africa/Bangui",
  kaga_bandoro: "Africa/Bangui",
  sibut: "Africa/Bangui",

  // Chad
  n_djamena: "Africa/Ndjamena",
  moundou: "Africa/Ndjamena",
  abeche: "Africa/Ndjamena",
  sarh: "Africa/Ndjamena",
  kelo: "Africa/Ndjamena",
  koumra: "Africa/Ndjamena",
  dourbali: "Africa/Ndjamena",
  am_timan: "Africa/Ndjamena",
  bol: "Africa/Ndjamena",
  ati: "Africa/Ndjamena",

    // Comoros
  moroni: "Indian/Comoro",
  moutsamoudou: "Indian/Comoro",
  fomboni: "Indian/Comoro",
  domoni: "Indian/Comoro",
  tsembehou: "Indian/Comoro",

  // Congo (Republic of the Congo)
  brazzaville: "Africa/Brazzaville",
  pointe_noire: "Africa/Brazzaville",
  dolisie: "Africa/Brazzaville",
  nkayi: "Africa/Brazzaville",
  ouesso: "Africa/Brazzaville",
  impfondo: "Africa/Brazzaville",
  sibiti: "Africa/Brazzaville",
  owando: "Africa/Brazzaville",

  // Costa Rica
  san_jose: "America/Costa_Rica",
  alajuela: "America/Costa_Rica",
  cartago: "America/Costa_Rica",
  heredia: "America/Costa_Rica",
  liberia: "America/Costa_Rica",
  puntarenas: "America/Costa_Rica",
  limon: "America/Costa_Rica",
  san_isidro: "America/Costa_Rica",

  // Côte d'Ivoire
  abidjan: "Africa/Abidjan",
  yamoussoukro: "Africa/Abidjan",
  bouake: "Africa/Abidjan",
  daloa: "Africa/Abidjan",
  korhogo: "Africa/Abidjan",
  san_pedro_ivory_coast: "Africa/Abidjan",
  man: "Africa/Abidjan",
  divo: "Africa/Abidjan",
  gagnoa: "Africa/Abidjan",
  abengourou: "Africa/Abidjan",

  // Croatia
  zagreb: "Europe/Zagreb",
  split: "Europe/Zagreb",
  rijeka: "Europe/Zagreb",
  osijek: "Europe/Zagreb",
  zadar: "Europe/Zagreb",
  pula: "Europe/Zagreb",
  dubrovnik: "Europe/Zagreb",
  sibenik: "Europe/Zagreb",
  varazdin: "Europe/Zagreb",
  slavonski_brod: "Europe/Zagreb",

  // Cuba
  havana: "America/Havana",
  santiago_de_cuba: "America/Havana",
  camaguey: "America/Havana",
  holguin: "America/Havana",
  santa_clara: "America/Havana",
  guantanamo: "America/Havana",
  bayamo: "America/Havana",
  cienfuegos: "America/Havana",
  pinar_del_rio: "America/Havana",
  matanzas: "America/Havana",

  // Cyprus
  nicosia: "Asia/Nicosia",
  limassol: "Asia/Nicosia",
  larnaca: "Asia/Nicosia",
  paphos: "Asia/Nicosia",
  famagusta: "Asia/Famagusta",
  kyrenia: "Asia/Famagusta",

    // North Korea
  pyongyang: "Asia/Pyongyang",
  hamhung: "Asia/Pyongyang",
  chongjin: "Asia/Pyongyang",
  nampho: "Asia/Pyongyang",
  wonsan: "Asia/Pyongyang",
  sinuiju: "Asia/Pyongyang",
  tanchon: "Asia/Pyongyang",
  kaechon: "Asia/Pyongyang",
  kaesong: "Asia/Pyongyang",
  sariwon: "Asia/Pyongyang",

  // DR Congo
  kinshasa: "Africa/Kinshasa",
  lubumbashi: "Africa/Lubumbashi",
  mbuji_mayi: "Africa/Lubumbashi",
  kananga: "Africa/Lubumbashi",
  kisangani: "Africa/Lubumbashi",
  bukavu: "Africa/Lubumbashi",
  goma: "Africa/Lubumbashi",
  kolwezi: "Africa/Lubumbashi",
  likasi: "Africa/Lubumbashi",
  tshikapa: "Africa/Lubumbashi",
  matadi: "Africa/Kinshasa",
  boma: "Africa/Kinshasa",

  // Djibouti
  djibouti_city: "Africa/Djibouti",
  ali_sabieh: "Africa/Djibouti",
  dikhil: "Africa/Djibouti",
  tadjoura: "Africa/Djibouti",
  obock: "Africa/Djibouti",
  arta: "Africa/Djibouti",

  // Dominica
  roseau: "America/Dominica",
  portsmouth: "America/Dominica",
  marigot: "America/Dominica",
  grand_bay: "America/Dominica",
  castle_bruce: "America/Dominica",

  // Dominican Republic
  santo_domingo: "America/Santo_Domingo",
  santiago_dominican: "America/Santo_Domingo",
  santo_domingo_oeste: "America/Santo_Domingo",
  san_pedro_de_macoris: "America/Santo_Domingo",
  la_romana: "America/Santo_Domingo",
  san_cristobal: "America/Santo_Domingo",
  higuey: "America/Santo_Domingo",
  puerto_plata: "America/Santo_Domingo",
  san_francisco_de_macoris: "America/Santo_Domingo",
  punta_cana: "America/Santo_Domingo",

  // Ecuador
  quito: "America/Guayaquil",
  guayaquil: "America/Guayaquil",
  cuenca: "America/Guayaquil",
  santo_domingo_ecuador: "America/Guayaquil",
  machala: "America/Guayaquil",
  manta: "America/Guayaquil",
  portoviejo: "America/Guayaquil",
  ambato: "America/Guayaquil",
  riobamba: "America/Guayaquil",
  loja: "America/Guayaquil",

  // El Salvador
  san_salvador: "America/El_Salvador",
  santa_ana: "America/El_Salvador",
  san_miguel: "America/El_Salvador",
  soyapango: "America/El_Salvador",
  mejicanos: "America/El_Salvador",
  santa_tecla: "America/El_Salvador",
  apopa: "America/El_Salvador",
  delgado: "America/El_Salvador",
  usulutan: "America/El_Salvador",
  cojutepeque: "America/El_Salvador",

  // Equatorial Guinea
  malabo: "Africa/Malabo",
  bata: "Africa/Malabo",
  ebebiyin: "Africa/Malabo",
  mongomo: "Africa/Malabo",
  evinayong: "Africa/Malabo",
  luba: "Africa/Malabo",
  anisoc: "Africa/Malabo",

  // Eritrea
  asmara: "Africa/Asmara",
  keren: "Africa/Asmara",
  massawa: "Africa/Asmara",
  mendefera: "Africa/Asmara",
  assab: "Africa/Asmara",
  barentu: "Africa/Asmara",
  adi_keih: "Africa/Asmara",
  tessenei: "Africa/Asmara",

  // Estonia
  tallinn: "Europe/Tallinn",
  tartu: "Europe/Tallinn",
  narva: "Europe/Tallinn",
  parnu: "Europe/Tallinn",
  kohtla_jarve: "Europe/Tallinn",
  viljandi: "Europe/Tallinn",
  rakvere: "Europe/Tallinn",
  maardu: "Europe/Tallinn",
  kuressaare: "Europe/Tallinn",
  voru: "Europe/Tallinn",

  // Eswatini
  mbabane: "Africa/Mbabane",
  manzini: "Africa/Mbabane",
  lobamba: "Africa/Mbabane",
  siteki: "Africa/Mbabane",
  nhlangano: "Africa/Mbabane",
  piggs_peak: "Africa/Mbabane",
  simunye: "Africa/Mbabane",

  // Ethiopia
  addis_ababa: "Africa/Addis_Ababa",
  dire_dawa: "Africa/Addis_Ababa",
  mekelle: "Africa/Addis_Ababa",
  adama: "Africa/Addis_Ababa",
  bahir_dar: "Africa/Addis_Ababa",
  gondar: "Africa/Addis_Ababa",
  hawassa: "Africa/Addis_Ababa",
  jimma: "Africa/Addis_Ababa",
  jijiga: "Africa/Addis_Ababa",
  dilla: "Africa/Addis_Ababa",

    // Fiji
  suva: "Pacific/Fiji",
  lautoka: "Pacific/Fiji",
  nadi: "Pacific/Fiji",
  labasa: "Pacific/Fiji",
  ba: "Pacific/Fiji",
  levuka: "Pacific/Fiji",
  sigatoka: "Pacific/Fiji",
  rakiraki: "Pacific/Fiji",

  // Gabon
  libreville: "Africa/Libreville",
  port_gentil: "Africa/Libreville",
  franceville: "Africa/Libreville",
  owendo: "Africa/Libreville",
  moanda: "Africa/Libreville",
  mouila: "Africa/Libreville",
  lambarene: "Africa/Libreville",
  tchibanga: "Africa/Libreville",
  koulamoutou: "Africa/Libreville",
  makokou: "Africa/Libreville",

  // Gambia
  banjul: "Africa/Banjul",
  serekunda: "Africa/Banjul",
  brikama: "Africa/Banjul",
  bakau: "Africa/Banjul",
  lamine: "Africa/Banjul",
  banjulunding: "Africa/Banjul",
  farafenni: "Africa/Banjul",
  basse_santa_su: "Africa/Banjul",

  // Georgia
  tbilisi: "Asia/Tbilisi",
  batumi: "Asia/Tbilisi",
  kutaisi: "Asia/Tbilisi",
  rustavi: "Asia/Tbilisi",
  zugdidi: "Asia/Tbilisi",
  gori: "Asia/Tbilisi",
  poti: "Asia/Tbilisi",
  telavi: "Asia/Tbilisi",
  samtredia: "Asia/Tbilisi",
  khashuri: "Asia/Tbilisi",

  // Ghana
  accra: "Africa/Accra",
  kumasi: "Africa/Accra",
  tamale: "Africa/Accra",
  takoradi: "Africa/Accra",
  achiaman: "Africa/Accra",
  tema: "Africa/Accra",
  sekondi: "Africa/Accra",
  cape_coast: "Africa/Accra",
  obuasi: "Africa/Accra",
  sunyani: "Africa/Accra",

  // Grenada
  "st. george's": "America/Grenada",
  gouyave: "America/Grenada",
  grenville: "America/Grenada",
  victoria_grenada: "America/Grenada",
  sauteurs: "America/Grenada",
  hillsborough: "America/Grenada",

  // Guatemala
  guatemala_city: "America/Guatemala",
  mixco: "America/Guatemala",
  villa_nueva: "America/Guatemala",
  quetzaltenango: "America/Guatemala",
  escuintla: "America/Guatemala",
  san_juan_sacatepequez: "America/Guatemala",
  chinautla: "America/Guatemala",
  coban: "America/Guatemala",
  puerto_barrios: "America/Guatemala",
  mazatenango: "America/Guatemala",

  // Guinea
  conakry: "Africa/Conakry",
  nzerekore: "Africa/Conakry",
  kankan: "Africa/Conakry",
  kindia: "Africa/Conakry",
  labe: "Africa/Conakry",
  gueckedou: "Africa/Conakry",
  mamou: "Africa/Conakry",
  siguiti: "Africa/Conakry",
  kissidougou: "Africa/Conakry",
  macenta: "Africa/Conakry",

  // Guinea-Bissau
  bissau: "Africa/Bissau",
  gabu: "Africa/Bissau",
  bafata: "Africa/Bissau",
  cacheu: "Africa/Bissau",
  canchungo: "Africa/Bissau",
  quionga: "Africa/Bissau",
  bula: "Africa/Bissau",

  // Guyana
  georgetown: "America/Guyana",
  linden: "America/Guyana",
  new_amsterdam: "America/Guyana",
  corriverton: "America/Guyana",
  mahaicony: "America/Guyana",
  rose_hall: "America/Guyana",
  skeldon: "America/Guyana",

  // Haiti
  "port-au-prince": "America/Port-au-Prince",
  cap_haitien: "America/Port-au-Prince",
  carrefour: "America/Port-au-Prince",
  delmas: "America/Port-au-Prince",
  petion_ville: "America/Port-au-Prince",
  gonaives: "America/Port-au-Prince",
  "les cayes": "America/Port-au-Prince",
  jacmel: "America/Port-au-Prince",
  saint_marc: "America/Port-au-Prince",
  "port-de-paix": "America/Port-au-Prince",

    // Honduras
  tegucigalpa: "America/Tegucigalpa",
  san_pedro_sula: "America/Tegucigalpa",
  choloma: "America/Tegucigalpa",
  la_ceiba: "America/Tegucigalpa",
  el_progreso: "America/Tegucigalpa",
  comayagua: "America/Tegucigalpa",
  puerto_cortes: "America/Tegucigalpa",
  danli: "America/Tegucigalpa",
  siguatepeque: "America/Tegucigalpa",
  catacamas: "America/Tegucigalpa",

  // Iceland
  reykjavik: "Atlantic/Reykjavik",
  kopavogur: "Atlantic/Reykjavik",
  hafnarfjordur: "Atlantic/Reykjavik",
  akureyri: "Atlantic/Reykjavik",
  reykjanesbaer: "Atlantic/Reykjavik",
  gardabaer: "Atlantic/Reykjavik",
  mosfellsbaer: "Atlantic/Reykjavik",
  selfoss: "Atlantic/Reykjavik",

  // Iran
  tehran: "Asia/Tehran",
  mashhad: "Asia/Tehran",
  isfahan: "Asia/Tehran",
  karaj: "Asia/Tehran",
  shiraz: "Asia/Tehran",
  tabriz: "Asia/Tehran",
  qom: "Asia/Tehran",
  ahvaz: "Asia/Tehran",
  kermanshah: "Asia/Tehran",
  urmia: "Asia/Tehran",

  // Iraq
  baghdad: "Asia/Baghdad",
  basra: "Asia/Baghdad",
  mosul: "Asia/Baghdad",
  erbil: "Asia/Baghdad",
  kirkuk: "Asia/Baghdad",
  najaf: "Asia/Baghdad",
  karbala: "Asia/Baghdad",
  sulaymaniyah: "Asia/Baghdad",
  nasiriyah: "Asia/Baghdad",
  amarah: "Asia/Baghdad",

  // Jamaica
  kingston: "America/Jamaica",
  spanish_town: "America/Jamaica",
  portmore: "America/Jamaica",
  montego_bay: "America/Jamaica",
  mandeville: "America/Jamaica",
  may_pen: "America/Jamaica",
  ocho_rios: "America/Jamaica",
  savanna_la_mar: "America/Jamaica",

  // Jordan
  amman: "Asia/Amman",
  zarqa: "Asia/Amman",
  irbid: "Asia/Amman",
  russeifa: "Asia/Amman",
  aqaba: "Asia/Amman",
  salt: "Asia/Amman",
  mafraq: "Asia/Amman",
  madaba: "Asia/Amman",
  ramtha: "Asia/Amman",

  // Kazakhstan
  almaty: "Asia/Almaty",
  astana: "Asia/Almaty",
  shymkent: "Asia/Almaty",
  karaganda: "Asia/Almaty",
  aktobe: "Asia/Aqtobe",
  taraz: "Asia/Almaty",
  pavlodar: "Asia/Almaty",
  semey: "Asia/Almaty",
  ust_kamenogorsk: "Asia/Almaty",
  atyrau: "Asia/Atyrau",
  kostanay: "Asia/Qostanay",

    // Kiribati
  tarawa: "Pacific/Tarawa",
  betio: "Pacific/Tarawa",
  kiritimati: "Pacific/Kiritimati",
  butaritari: "Pacific/Tarawa",
  bikenibeu: "Pacific/Tarawa",

  // Kuwait (already in Middle East block with added cities, no new block needed)

  // Kyrgyzstan
  bishkek: "Asia/Bishkek",
  osh: "Asia/Bishkek",
  jalal_abad: "Asia/Bishkek",
  karakol: "Asia/Bishkek",
  tokmok: "Asia/Bishkek",
  uzgen: "Asia/Bishkek",
  balykchy: "Asia/Bishkek",
  naryn: "Asia/Bishkek",
  talas: "Asia/Bishkek",

  // Laos
  vientiane: "Asia/Vientiane",
  luang_prabang: "Asia/Vientiane",
  savannakhet: "Asia/Vientiane",
  pakse: "Asia/Vientiane",
  thakhek: "Asia/Vientiane",
  xamnua: "Asia/Vientiane",
  phonsavan: "Asia/Vientiane",
  muang_xay: "Asia/Vientiane",

  // Latvia
  riga: "Europe/Riga",
  daugavpils: "Europe/Riga",
  liepaja: "Europe/Riga",
  jelgava: "Europe/Riga",
  jurmala: "Europe/Riga",
  ventspils: "Europe/Riga",
  rezekne: "Europe/Riga",
  valmiera: "Europe/Riga",

  // Lebanon
  beirut: "Asia/Beirut",
  tripoli: "Asia/Beirut",
  saida: "Asia/Beirut",
  zahle: "Asia/Beirut",
  tyre: "Asia/Beirut",
  jounieh: "Asia/Beirut",
  baalbek: "Asia/Beirut",
  nabatieh: "Asia/Beirut",

  // Lesotho
  maseru: "Africa/Maseru",
  teyateyaneng: "Africa/Maseru",
  mafeteng: "Africa/Maseru",
  mohales_hoek: "Africa/Maseru",
  quthing: "Africa/Maseru",
  butha_buthe: "Africa/Maseru",
  maputsoe: "Africa/Maseru",
  leribe: "Africa/Maseru",

  // Liberia
  monrovia: "Africa/Monrovia",
  gbarnga: "Africa/Monrovia",
  buchanan: "Africa/Monrovia",
  ganta: "Africa/Monrovia",
  kpandu: "Africa/Monrovia",
  harper: "Africa/Monrovia",
  zorzor: "Africa/Monrovia",

  // Libya
  tripoli_libya: "Africa/Tripoli",
  benghazi: "Africa/Tripoli",
  misrata: "Africa/Tripoli",
  zliten: "Africa/Tripoli",
  bayda: "Africa/Tripoli",
  khoms: "Africa/Tripoli",
  sabha: "Africa/Tripoli",
  sirt: "Africa/Tripoli",
  tobruk: "Africa/Tripoli",

  // Liechtenstein
  vaduz: "Europe/Vaduz",
  schaan: "Europe/Vaduz",
  triesen: "Europe/Vaduz",
  eschen: "Europe/Vaduz",
  mauren: "Europe/Vaduz",
  ruggell: "Europe/Vaduz",

  // Lithuania
  vilnius: "Europe/Vilnius",
  kaunas: "Europe/Vilnius",
  klaipeda: "Europe/Vilnius",
  siauliai: "Europe/Vilnius",
  panevezys: "Europe/Vilnius",
  alytus: "Europe/Vilnius",
  marijampole: "Europe/Vilnius",
  mazeikiai: "Europe/Vilnius",

  // Luxembourg
  luxembourg: "Europe/Luxembourg",
  esch_sur_alzette: "Europe/Luxembourg",
  differdange: "Europe/Luxembourg",
  dudelange: "Europe/Luxembourg",
  ettelbruck: "Europe/Luxembourg",
  petange: "Europe/Luxembourg",
  sanem: "Europe/Luxembourg",

    // Madagascar
  antananarivo: "Indian/Antananarivo",
  toamasina: "Indian/Antananarivo",
  antsirabe: "Indian/Antananarivo",
  mahajanga: "Indian/Antananarivo",
  fianarantsoa: "Indian/Antananarivo",
  toliara: "Indian/Antananarivo",
  antsiranana: "Indian/Antananarivo",
  ambositra: "Indian/Antananarivo",

  // Malawi
  lilongwe: "Africa/Blantyre",
  blantyre: "Africa/Blantyre",
  mzuzu: "Africa/Blantyre",
  zomba: "Africa/Blantyre",
  kasungu: "Africa/Blantyre",
  mangochi: "Africa/Blantyre",
  karonga: "Africa/Blantyre",
  salima: "Africa/Blantyre",

  // Maldives
  male: "Indian/Maldives",
  addu_city: "Indian/Maldives",
  fuahmulah: "Indian/Maldives",
  kulhudhuffushi: "Indian/Maldives",
  thinadhoo: "Indian/Maldives",

  // Mali
  bamako: "Africa/Bamako",
  sikasso: "Africa/Bamako",
  mopti: "Africa/Bamako",
  koutiala: "Africa/Bamako",
  segou: "Africa/Bamako",
  kayes: "Africa/Bamako",
  kalabancoro: "Africa/Bamako",
  gao: "Africa/Bamako",
  tombouctou: "Africa/Bamako",

  // Malta
  valletta: "Europe/Malta",
  birkirkara: "Europe/Malta",
  mosta: "Europe/Malta",
  qormi: "Europe/Malta",
  sliema: "Europe/Malta",
  "st. paul's bay": "Europe/Malta",
  zebbug: "Europe/Malta",

  // Marshall Islands
  majuro: "Pacific/Majuro",
  kwajalein: "Pacific/Kwajalein",
  jaluit: "Pacific/Majuro",
  wotje: "Pacific/Majuro",
  ebeye: "Pacific/Kwajalein",

  // Mauritania
  nouakchott: "Africa/Nouakchott",
  nouadhibou: "Africa/Nouakchott",
  kaedi: "Africa/Nouakchott",
  zouerate: "Africa/Nouakchott",
  rosso: "Africa/Nouakchott",
  selibaby: "Africa/Nouakchott",
  atar: "Africa/Nouakchott",

  // Mauritius
  "port louis": "Indian/Mauritius",
  "beau bassin-rose hill": "Indian/Mauritius",
  vacoas: "Indian/Mauritius",
  curepipe: "Indian/Mauritius",
  quatre_bornes: "Indian/Mauritius",
  triaolet: "Indian/Mauritius",

  // Micronesia
  palikir: "Pacific/Chuuk",
  weno: "Pacific/Chuuk",
  kolonia: "Pacific/Pohnpei",
  tofol: "Pacific/Kosrae",
  lelu: "Pacific/Kosrae",

  // Monaco
  monaco: "Europe/Monaco",
  la_condamine: "Europe/Monaco",
  monte_carlo: "Europe/Monaco",
  fontvieille: "Europe/Monaco",

  // Mongolia
  ulaanbaatar: "Asia/Ulaanbaatar",
  darkhan: "Asia/Ulaanbaatar",
  erdenet: "Asia/Ulaanbaatar",
  choibalsan: "Asia/Choibalsan",
  moron: "Asia/Ulaanbaatar",
  khovd: "Asia/Hovd",
  olgii: "Asia/Hovd",
  bayanhongor: "Asia/Ulaanbaatar",

  // Montenegro
  podgorica: "Europe/Podgorica",
  niksic: "Europe/Podgorica",
  bijelo_polje: "Europe/Podgorica",
  bar: "Europe/Podgorica",
  herceg_novi: "Europe/Podgorica",
  kotor: "Europe/Podgorica",
  budva: "Europe/Podgorica",

  // Mozambique
  maputo: "Africa/Maputo",
  beira: "Africa/Maputo",
  nampula: "Africa/Maputo",
  matola: "Africa/Maputo",
  quelimane: "Africa/Maputo",
  tete: "Africa/Maputo",
  lichinga: "Africa/Maputo",
  pemba: "Africa/Maputo",

  // Myanmar (Burma)
  yangon: "Asia/Yangon",
  mandalay: "Asia/Yangon",
  naypyidaw: "Asia/Yangon",
  mawlamyine: "Asia/Yangon",
  bagan: "Asia/Yangon",
  taunggyi: "Asia/Yangon",
  monywa: "Asia/Yangon",
  pathein: "Asia/Yangon",

  // Namibia
  windhoek: "Africa/Windhoek",
  walvis_bay: "Africa/Windhoek",
  swakopmund: "Africa/Windhoek",
  oshakati: "Africa/Windhoek",
  rundu: "Africa/Windhoek",
  katima_mulilo: "Africa/Windhoek",
  gobabis: "Africa/Windhoek",

  // Nauru
  yaren: "Pacific/Nauru",
  denigomodu: "Pacific/Nauru",
  aiwo: "Pacific/Nauru",
  meneng: "Pacific/Nauru",

  // Nepal
  kathmandu: "Asia/Kathmandu",
  pokhara: "Asia/Kathmandu",
  lalitpur: "Asia/Kathmandu",
  bharatpur: "Asia/Kathmandu",
  birgunj: "Asia/Kathmandu",
  biratnagar: "Asia/Kathmandu",
  dharan: "Asia/Kathmandu",
  janakpur: "Asia/Kathmandu",

  // Nicaragua
  managua: "America/Managua",
  leon_nicaragua: "America/Managua",
  masaya: "America/Managua",
  chinandega: "America/Managua",
  matagalpa: "America/Managua",
  esteli: "America/Managua",
  granada: "America/Managua",
  juigalpa: "America/Managua",

  // Niger
  niamey: "Africa/Niamey",
  zinder: "Africa/Niamey",
  maradi: "Africa/Niamey",
  tahoua: "Africa/Niamey",
  agadez: "Africa/Niamey",
  dosso: "Africa/Niamey",

  // North Macedonia
  skopje: "Europe/Skopje",
  bitola: "Europe/Skopje",
  kumanovo: "Europe/Skopje",
  prilep: "Europe/Skopje",
  tetovo: "Europe/Skopje",
  ohrid: "Europe/Skopje",
  gostivar: "Europe/Skopje",
  shtip: "Europe/Skopje",

  // Palau
  koror: "Pacific/Palau",
  ngerulmud: "Pacific/Palau",
  melekeok: "Pacific/Palau",
  airai: "Pacific/Palau",

  // Panama
  "panama city": "America/Panama",
  san_miguelito: "America/Panama",
  colon: "America/Panama",
  david: "America/Panama",
  la_chorrera: "America/Panama",
  santiago_de_veraguas: "America/Panama",
  penonome: "America/Panama",
  tocumen: "America/Panama",

  // Papua New Guinea
  "port moresby": "Pacific/Port_Moresby",
  lae: "Pacific/Port_Moresby",
  "mount hagen": "Pacific/Port_Moresby",
  madang: "Pacific/Port_Moresby",
  goroka: "Pacific/Port_Moresby",
  rabaul: "Pacific/Port_Moresby",
  arawa: "Pacific/Bougainville",
  kavieng: "Pacific/Port_Moresby",

  // Paraguay
  asuncion: "America/Asuncion",
  "ciudad del este": "America/Asuncion",
  san_lorenzo: "America/Asuncion",
  luque: "America/Asuncion",
  encarnacion: "America/Asuncion",
  lambare: "America/Asuncion",
  pedro_juan_caballero: "America/Asuncion",

  // Moldova
  chisinau: "Europe/Chisinau",
  balti: "Europe/Chisinau",
  ungheni: "Europe/Chisinau",
  cahul: "Europe/Chisinau",
  soroca: "Europe/Chisinau",
  orhei: "Europe/Chisinau",
  comrat: "Europe/Chisinau",

    // Rwanda
  kigali: "Africa/Kigali",
  butare: "Africa/Kigali",
  gitarama: "Africa/Kigali",
  ruhengeri: "Africa/Kigali",
  gisenyi: "Africa/Kigali",
  cyangugu: "Africa/Kigali",
  kibuye: "Africa/Kigali",
  kibungo: "Africa/Kigali",

  // Saint Kitts and Nevis
  basseterre: "America/St_Kitts",
  charlestown: "America/St_Kitts",
  cayon: "America/St_Kitts",
  sandy_point: "America/St_Kitts",

  // Saint Lucia
  castries: "America/St_Lucia",
  vieux_fort: "America/St_Lucia",
  micoud: "America/St_Lucia",
  soufriere: "America/St_Lucia",
  gros_islet: "America/St_Lucia",

  // Saint Vincent and the Grenadines
  kingstown: "America/St_Vincent",
  georgetown_svg: "America/St_Vincent",
  byera: "America/St_Vincent",
  barangarie: "America/St_Vincent",
  layou: "America/St_Vincent",

  // Samoa
  apia: "Pacific/Apia",
  vaitele: "Pacific/Apia",
  faleula: "Pacific/Apia",
  vailele: "Pacific/Apia",
  salelologa: "Pacific/Apia",

  // San Marino
  san_marino: "Europe/San_Marino",
  serravalle: "Europe/San_Marino",
  borgo_maggiore: "Europe/San_Marino",
  domagnano: "Europe/San_Marino",

  // Sao Tome and Principe
  sao_tome: "Africa/Sao_Tome",
  trindade: "Africa/Sao_Tome",
  santana: "Africa/Sao_Tome",
  neves: "Africa/Sao_Tome",

  // Senegal
  dakar: "Africa/Dakar",
  touba: "Africa/Dakar",
  thies: "Africa/Dakar",
  kaolack: "Africa/Dakar",
  saint_louis: "Africa/Dakar",
  mbour: "Africa/Dakar",
  ziguinchor: "Africa/Dakar",
  diourbel: "Africa/Dakar",

  // Serbia
  belgrade: "Europe/Belgrade",
  novi_sad: "Europe/Belgrade",
  nis: "Europe/Belgrade",
  kragujevac: "Europe/Belgrade",
  subotica: "Europe/Belgrade",
  zrenjanin: "Europe/Belgrade",
  pancevo: "Europe/Belgrade",
  cuckavec: "Europe/Belgrade",

  // Seychelles
  victoria_seychelles: "Indian/Mahe",
  anse_boileau: "Indian/Mahe",
  beau_vallon: "Indian/Mahe",
  anse_royale: "Indian/Mahe",

  // Sierra Leone
  freetown: "Africa/Freetown",
  bo: "Africa/Freetown",
  kenema: "Africa/Freetown",
  makeni: "Africa/Freetown",
  koidu: "Africa/Freetown",
  lunsar: "Africa/Freetown",
  port_loko: "Africa/Freetown",

  // Slovakia
  bratislava: "Europe/Bratislava",
  kosice: "Europe/Bratislava",
  presov: "Europe/Bratislava",
  zilina: "Europe/Bratislava",
  nitra: "Europe/Bratislava",
  banska_bystrica: "Europe/Bratislava",
  trnava: "Europe/Bratislava",

  // Slovenia
  ljubljana: "Europe/Ljubljana",
  maribor: "Europe/Ljubljana",
  celje: "Europe/Ljubljana",
  kranj: "Europe/Ljubljana",
  koper: "Europe/Ljubljana",
  velenje: "Europe/Ljubljana",
  novo_mesto: "Europe/Ljubljana",

  // Solomon Islands
  honiara: "Pacific/Guadalcanal",
  auki: "Pacific/Guadalcanal",
  gizo: "Pacific/Guadalcanal",
  noro: "Pacific/Guadalcanal",
  kirakira: "Pacific/Guadalcanal",

  // Somalia
  mogadishu: "Africa/Mogadishu",
  hargeisa: "Africa/Mogadishu",
  kismayo: "Africa/Mogadishu",
  baidoa: "Africa/Mogadishu",
  garowe: "Africa/Mogadishu",
  marka: "Africa/Mogadishu",
  bosaso: "Africa/Mogadishu",

  // South Sudan
  juba: "Africa/Juba",
  wau: "Africa/Juba",
  malakal: "Africa/Juba",
  yambio: "Africa/Juba",
  bentiu: "Africa/Juba",
  bor: "Africa/Juba",

  // Sri Lanka
  colombo: "Asia/Colombo",
  kandy: "Asia/Colombo",
  galle: "Asia/Colombo",
  jaffna: "Asia/Colombo",
  negombo: "Asia/Colombo",
  batticaloa: "Asia/Colombo",
  anuradhapura: "Asia/Colombo",

  // Sudan
  khartoum: "Africa/Khartoum",
  omdurman: "Africa/Khartoum",
  "port sudan": "Africa/Khartoum",
  kassala: "Africa/Khartoum",
  "el obeid": "Africa/Khartoum",
  nyala: "Africa/Khartoum",
  wad_medani: "Africa/Khartoum",

  // Suriname
  paramaribo: "America/Paramaribo",
  lelydorp: "America/Paramaribo",
  nieuw_nickerie: "America/Paramaribo",
  moengo: "America/Paramaribo",
  albina: "America/Paramaribo",

  // Syria
  damascus: "Asia/Damascus",
  aleppo: "Asia/Damascus",
  homs: "Asia/Damascus",
  latakia: "Asia/Damascus",
  hama: "Asia/Damascus",
  raqqa: "Asia/Damascus",
  "deir ez-zor": "Asia/Damascus",

  // Tajikistan
  dushanbe: "Asia/Dushanbe",
  khujand: "Asia/Dushanbe",
  kulob: "Asia/Dushanbe",
  kurgan_tube: "Asia/Dushanbe",
  istaravshan: "Asia/Dushanbe",
  tursunzoda: "Asia/Dushanbe",

  // Tanzania
  dar_es_salaam: "Africa/Dar_es_Salaam",
  dodoma: "Africa/Dar_es_Salaam",
  mwanza: "Africa/Dar_es_Salaam",
  arusha: "Africa/Dar_es_Salaam",
  mbeya: "Africa/Dar_es_Salaam",
  zanzibar_city: "Africa/Dar_es_Salaam",
  tabora: "Africa/Dar_es_Salaam",

  // Timor-Leste
  dili: "Asia/Dili",
  maliana: "Asia/Dili",
  suai: "Asia/Dili",
  baucau: "Asia/Dili",
  liquica: "Asia/Dili",

  // Togo
  lome: "Africa/Lome",
  sokode: "Africa/Lome",
  kara: "Africa/Lome",
  dapaong: "Africa/Lome",
  atakpame: "Africa/Lome",

  // Tonga
  "nuku'alofa": "Pacific/Tongatapu",
  neiafu: "Pacific/Tongatapu",
  pangai: "Pacific/Tongatapu",
  hihifo: "Pacific/Tongatapu",

  // Trinidad and Tobago
  "port of spain": "America/Port_of_Spain",
  chaguanas: "America/Port_of_Spain",
  san_fernando: "America/Port_of_Spain",
  arima: "America/Port_of_Spain",
  "point fortin": "America/Port_of_Spain",

  // Tunisia
  tunis: "Africa/Tunis",
  sfax: "Africa/Tunis",
  sousse: "Africa/Tunis",
  kairouan: "Africa/Tunis",
  gabes: "Africa/Tunis",
  bizerte: "Africa/Tunis",
  ariana: "Africa/Tunis",

  // Turkmenistan
  ashgabat: "Asia/Ashgabat",
  turkmenabat: "Asia/Ashgabat",
  dasoguz: "Asia/Ashgabat",
  mary: "Asia/Ashgabat",
  balkanabat: "Asia/Ashgabat",

  // Tuvalu
  funafuti: "Pacific/Funafuti",
  vaiaku: "Pacific/Funafuti",

  // Uganda
  kampala: "Africa/Kampala",
  gulu: "Africa/Kampala",
  lira: "Africa/Kampala",
  jinja: "Africa/Kampala",
  mbarara: "Africa/Kampala",
  mbale: "Africa/Kampala",
  entebbe: "Africa/Kampala",

  // Ukraine
  kyiv: "Europe/Kyiv",
  kharkiv: "Europe/Kyiv",
  odesa: "Europe/Kyiv",
  dnipro: "Europe/Kyiv",
  lviv: "Europe/Kyiv",
  zaporizhzhia: "Europe/Kyiv",
  kryvyi_rih: "Europe/Kyiv",
  mykolaiv: "Europe/Kyiv",

  // Uruguay
  montevideo: "America/Montevideo",
  salto: "America/Montevideo",
  "ciudad de la costa": "America/Montevideo",
  paysandu: "America/Montevideo",
  las_piedras: "America/Montevideo",
  rivera: "America/Montevideo",
  maldonado: "America/Montevideo",

  // Uzbekistan
  tashkent: "Asia/Tashkent",
  samarkand: "Asia/Samarkand",
  namangan: "Asia/Tashkent",
  andijan: "Asia/Tashkent",
  bukhara: "Asia/Samarkand",
  nukus: "Asia/Samarkand",
  fergana: "Asia/Tashkent",

  // Vanuatu
  "port vila": "Pacific/Efate",
  luganville: "Pacific/Efate",
  isangel: "Pacific/Efate",
  solak: "Pacific/Efate",

  // Yemen
  sanaa: "Asia/Aden",
  aden: "Asia/Aden",
  taiz: "Asia/Aden",
  hodeidah: "Asia/Aden",
  ibb: "Asia/Aden",
  mukalla: "Asia/Aden",

  // Zambia
  lusaka: "Africa/Lusaka",
  kitwe: "Africa/Lusaka",
  ndola: "Africa/Lusaka",
  kabwe: "Africa/Lusaka",
  chingola: "Africa/Lusaka",
  livingstone: "Africa/Lusaka",
  chipata: "Africa/Lusaka",

  // Zimbabwe
  harare: "Africa/Harare",
  bulawayo: "Africa/Harare",
  chitungwiza: "Africa/Harare",
  mutare: "Africa/Harare",
  gweru: "Africa/Harare",
  kwekwe: "Africa/Harare",
  masvingo: "Africa/Harare",
};

async function resolveCityToTimezone(city: string): Promise<string | null> {
  // 1. Check hardcoded map
  const key = city.toLowerCase().trim();
  if (HARDCODED_TIMEZONES[key]) return HARDCODED_TIMEZONES[key];

  // 2. Use Open‑Meteo geocoding (free, no key)
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        return data.results[0].timezone; // e.g. "Asia/Karachi"
      }
    }
  } catch {}

  // 3. Fallback to Google Maps Geocoding API (if key exists)
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          const timezoneId = data.results[0].address_components?.find((comp: any) => 
            comp.types?.includes('locality') || comp.types?.includes('administrative_area_level_1')
          )?.short_name;
          if (timezoneId) {
            // Map common timezone abbreviations to IANA
            const tzMap: Record<string, string> = {
              'PK': 'Asia/Karachi',
              'IN': 'Asia/Kolkata',
              'US': 'America/New_York',
              'UK': 'Europe/London',
              'JP': 'Asia/Tokyo',
              'AU': 'Australia/Sydney',
              'AE': 'Asia/Dubai',
              'SA': 'Asia/Riyadh',
              'CA': 'America/Toronto',
              'DE': 'Europe/Berlin',
              'FR': 'Europe/Paris',
              'IT': 'Europe/Rome',
              'ES': 'Europe/Madrid',
              'BR': 'America/Sao_Paulo',
              'MX': 'America/Mexico_City',
              'RU': 'Europe/Moscow',
              'CN': 'Asia/Shanghai',
              'KR': 'Asia/Seoul',
              'SG': 'Asia/Singapore',
              'TH': 'Asia/Bangkok',
              'ID': 'Asia/Jakarta',
              'MY': 'Asia/Kuala_Lumpur',
              'PH': 'Asia/Manila',
              'VN': 'Asia/Ho_Chi_Minh',
              'TR': 'Europe/Istanbul',
              'ZA': 'Africa/Johannesburg',
              'EG': 'Africa/Cairo',
              'NG': 'Africa/Lagos',
              'KE': 'Africa/Nairobi',
              'AR': 'America/Argentina/Buenos_Aires',
              'CL': 'America/Santiago',
              'CO': 'America/Bogota',
              'PE': 'America/Lima',
              'VE': 'America/Caracas',
            };
            return tzMap[timezoneId] || null;
          }
        }
      }
    } catch {}
  }

  return null;
}

// Comprehensive weather icon mapping (OpenWeatherMap icon codes to custom icons)
const WEATHER_ICON_MAP: Record<string, string> = {
  // Clear sky
  "01d": "sun",           // day
  "01n": "night",         // night
  
  // Few clouds
  "02d": "partly_cloudy_day",
  "02n": "partly_cloudy_night",
  
  // Scattered clouds
  "03d": "cloudy",
  "03n": "cloudy",
  
  // Broken clouds
  "04d": "overcast",
  "04n": "overcast",
  
  // Shower rain
  "09d": "rain_light",
  "09n": "rain_light",
  
  // Rain
  "10d": "rain",
  "10n": "rain",
  
  // Thunderstorm
  "11d": "storm",
  "11n": "storm",
  
  // Snow
  "13d": "snow",
  "13n": "snow",
  
  // Mist
  "50d": "fog",
  "50n": "fog",
  
  // Additional conditions
  "rain_light": "rain_light",
  "rain_heavy": "rain_heavy",
  "drizzle": "drizzle",
  "sleet": "sleet",
  "hail": "hail",
  "wind": "wind",
  "tornado": "tornado",
  "hurricane": "hurricane",
};

function mapWeatherIcon(iconCode: string): string {
  return WEATHER_ICON_MAP[iconCode] || "cloud";
}

// ── Weather (returns widget marker) ──────────
export async function getWeather(city: string): Promise<string> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
    );
    if (!res.ok) return "";
    const data = await res.json();
    const weatherData = {
      city: data.name,
      country: data.sys.country,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: mapWeatherIcon(data.weather[0].icon),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      visibility: (data.visibility / 1000).toFixed(1),
      pressure: data.main.pressure,
      cloudiness: data.clouds.all,
    };
    return `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
  } catch {
    return "";
  }
}

// ── Unified time/date data fetcher (used by clock & calendar) ──
export async function fetchTimeData(zone?: string, userTimezone?: string): Promise<{
  utcDatetime: string;
  timezone: string;
  label: string;
  formattedTime?: string; // Pre-formatted time string
  formattedDate?: string; // Pre-formatted date string
} | null> {
  let resolvedZone = zone || userTimezone || "UTC";

  // If a zone was provided and it's not already an IANA timezone, resolve it
  if (zone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(zone)) {
    const resolved = await resolveCityToTimezone(zone);
    if (resolved) resolvedZone = resolved;
    else {
      // Could not resolve – return null and let the caller decide
      console.warn("Could not resolve timezone for:", zone);
      return null;
    }
  }

  // Try TimeZoneDB (if key exists)
  const tzKey = process.env.TIMEZONEDB_API_KEY;
  if (tzKey) {
    try {
      const res = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${tzKey}&format=json&by=zone&zone=${encodeURIComponent(resolvedZone)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") {
          // Use the formatted string directly from TimeZoneDB - it's already in the target timezone
          // Format: "2026-07-21 12:45:33"
          const formatted = data.formatted;
          const [datePart, timePart] = formatted.split(" ");
          const [year, month, day] = datePart.split("-");
          const [hour, minute, second] = timePart.split(":");

          // Manually format the time to avoid server-side timezone conversion issues
          const hourNum = parseInt(hour, 10);
          const isPM = hourNum >= 12;
          const hour12 = hourNum % 12 || 12;
          const ampm = isPM ? "PM" : "AM";

          const timeStr = `${hour12}:${minute}:${second} ${ampm}`;

          // Format the date manually
          const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const dayName = dayNames[dateObj.getDay()];
          const monthName = monthNames[parseInt(month) - 1];

          const dateStr = `${dayName}, ${monthName} ${parseInt(day)}, ${year}`;

          return {
            utcDatetime: data.utc_datetime || new Date(data.timestamp * 1000).toISOString(),
            timezone: data.zoneName,
            label: `${zone || data.zoneName}`,
            formattedTime: timeStr,
            formattedDate: dateStr,
          };
        }
      }
    } catch {}
  }

  // Fallback: worldtimeapi.org
  try {
    const res = await fetch(
      `https://worldtimeapi.org/api/timezone/${encodeURIComponent(resolvedZone)}`
    );
    if (res.ok) {
      const data = await res.json();
      // Use datetime (already in target timezone) and format manually
      const datetime = data.datetime; // e.g., "2026-07-21T12:45:33+05:00"
      const datePart = datetime.split("T")[0];
      const timePart = datetime.split("T")[1].split("+")[0].split("Z")[0];
      const [year, month, day] = datePart.split("-");
      const [hour, minute, second] = timePart.split(":");

      // Manually format the time
      const hourNum = parseInt(hour, 10);
      const isPM = hourNum >= 12;
      const hour12 = hourNum % 12 || 12;
      const ampm = isPM ? "PM" : "AM";

      const timeStr = `${hour12}:${minute}:${second} ${ampm}`;

      // Format the date manually
      const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayName = dayNames[dateObj.getDay()];
      const monthName = monthNames[parseInt(month) - 1];

      const dateStr = `${dayName}, ${monthName} ${parseInt(day)}, ${year}`;

      return {
        utcDatetime: data.utc_datetime,
        timezone: data.timezone,
        label: `${zone || data.timezone}`,
        formattedTime: timeStr,
        formattedDate: dateStr,
      };
    }
  } catch {}

  return null; // No more fallbacks – if we can't get the time, we return null
}

// ── Time (returns clock widget marker) ───────
export async function getCurrentTimeCard(zone?: string, userTimezone?: string): Promise<string> {
  const data = await fetchTimeData(zone, userTimezone);
  if (!data) return "";
  const clockData = {
    utcDatetime: data.utcDatetime,
    timezone: data.timezone,
    label: data.label,
    formattedTime: data.formattedTime,
    formattedDate: data.formattedDate,
  };
  return `<!--WIDGET:CLOCK:${JSON.stringify(clockData)}-->`;
}

// ── Date / Calendar (returns calendar widget marker) ──
export async function getCurrentCalendarCard(zone?: string, userTimezone?: string): Promise<string> {
  const data = await fetchTimeData(zone, userTimezone);
  if (!data) return "";
  const calData = {
    utcDatetime: data.utcDatetime,
    timezone: data.timezone,
    label: data.label,
    formattedDate: data.formattedDate,
  };
  return `<!--WIDGET:CALENDAR:${JSON.stringify(calData)}-->`;
}

// ── News (returns plain text, no widget) ──────
export async function getNews(query?: string): Promise<string> {
  const key = process.env.NEWSAPI_API_KEY;
  if (!key) return "";
  const q = query || "latest";
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=5&apiKey=${key}`
    );
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.articles?.length) return "";
    return data.articles
      .map((a: any) => `- [${a.title}](${a.url}) (${a.source.name})`)
      .join("\n");
  } catch {
    return "";
  }
}