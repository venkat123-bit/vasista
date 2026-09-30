// English <-> Telugu language switcher.
// - Adds a language button to the navbar (or the login/signup header).
// - Swaps text on the page using the dictionary below; the choice is remembered.
// - Anything not in the dictionary (phone numbers, emails, UPI ID...) stays as-is.
// To fix or improve a translation, just edit the Telugu side of the matching line.
(function () {
  var KEY = "vasista_lang";

  // ---------- Dictionary: exact English text -> Telugu ----------
  var TE = {
    // Page titles
    "Our Story — Vasista Food and Traders": "మా కథ — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Contact — Vasista Food and Traders": "సంప్రదించండి — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Vasista Food and Traders — Naturally Made Snacks": "వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్ — సహజంగా తయారైన స్నాక్స్",
    "Login — Vasista Food and Traders": "లాగిన్ — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Order — Vasista Food and Traders": "ఆర్డర్ — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "My Profile — Vasista Food and Traders": "నా ప్రొఫైల్ — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Create Account — Vasista Food and Traders": "ఖాతా సృష్టించండి — వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",

    // Brand + navigation
    "Vasista": "వసిష్ఠ",
    "FOOD & TRADERS": "ఫుడ్ & ట్రేడర్స్",
    "Home": "హోమ్",
    "Why Vasista Food and Traders": "ఎందుకు వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Products": "ఉత్పత్తులు",
    "Contact": "సంప్రదించండి",
    "Order Now": "ఇప్పుడే ఆర్డర్ చేయండి",
    "Cart": "కార్ట్",
    "Profile": "ప్రొఫైల్",
    "Login": "లాగిన్",

    // About
    "OUR STORY": "మా కథ",
    "Naturally made, close to home": "సహజంగా తయారైనవి, మీ ఇంటికి దగ్గరగా",
    "A small Secunderabad kitchen turning millets, ragi and quinoa into snacks you can feel good about — no preservatives, no shortcuts.": "సికింద్రాబాద్\u200cలోని ఒక చిన్న వంటశాల — చిరుధాన్యాలు, రాగులు, క్వినోవాలను ప్రిజర్వేటివ్\u200cలు లేకుండా, షార్ట్\u200cకట్\u200cలు లేకుండా, మీరు మనసారా తినగలిగే స్నాక్స్\u200cగా మార్చుతోంది.",
    "Vasista Food and Traders started with a simple idea: snacking shouldn't mean choosing between taste and health. We work with traditional grains — millets, ragi, quinoa — and turn them into everyday snacks using small batches, so every pack that reaches you is fresh, not something that's been sitting on a shelf for months.": "వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్ ఒక సాధారణ ఆలోచనతో మొదలైంది: స్నాక్స్ తినడం అంటే రుచికి, ఆరోగ్యానికి మధ్య ఎంచుకోవడం కాకూడదు. మేము చిరుధాన్యాలు, రాగులు, క్వినోవా వంటి సంప్రదాయ ధాన్యాలతో పని చేస్తాము, వాటిని చిన్న బ్యాచ్\u200cలల్లో రోజువారీ స్నాక్స్\u200cగా తయారు చేస్తాము — అందుకే మీకు చేరే ప్రతి ప్యాక్ తాజాగా ఉంటుంది, నెలల తరబడి షెల్ఫ్\u200cలో ఉన్నది కాదు.",
    "Every recipe skips artificial preservatives, colours and shortcuts. What goes into the pack is what we'd happily feed our own families — real grains, real roasting, real flavour. It's why we call it Choose Natural, Live Better — not just a tagline, but how we make everything we sell.": "ప్రతి వంటకంలోనూ కృత్రిమ ప్రిజర్వేటివ్\u200cలు, రంగులు, షార్ట్\u200cకట్\u200cలు ఉండవు. ప్యాక్\u200cలో ఉన్నది మా సొంత కుటుంబాలకు ఆనందంగా తినిపించేదే — నిజమైన ధాన్యాలు, నిజమైన రోస్టింగ్, నిజమైన రుచి. అందుకే మేము దీనిని 'ఛూజ్ నేచురల్, లివ్ బెటర్' అంటాము — ఇది కేవలం ట్యాగ్\u200cలైన్ కాదు, మేము అమ్మే ప్రతిదాన్ని తయారు చేసే విధానం.",
    "WHY VASISTA": "ఎందుకు వసిష్ఠ",
    "Why Choose Natural": "సహజమైనదే ఎందుకు ఎంచుకోవాలి",
    "No preservatives": "ప్రిజర్వేటివ్\u200cలు లేవు",
    "Nothing artificial goes into any Vasista pack — just real grains and real flavour.": "ఏ వసిష్ఠ ప్యాక్\u200cలోనూ కృత్రిమమైనది ఏదీ ఉండదు — నిజమైన ధాన్యాలు, నిజమైన రుచి మాత్రమే.",
    "Slow-roasted, small batches": "నెమ్మదిగా కాల్చినవి, చిన్న బ్యాచ్\u200cలు",
    "We make in limited batches so every pack reaches you fresh, not off a warehouse shelf.": "మేము పరిమిత బ్యాచ్\u200cలల్లో తయారు చేస్తాము, అందువల్ల ప్రతి ప్యాక్ గోడౌన్ షెల్ఫ్ నుండి కాకుండా తాజాగా మీకు చేరుతుంది.",
    "Millets, ragi & quinoa": "చిరుధాన్యాలు, రాగులు & క్వినోవా",
    "Traditional grains at the core of every recipe, for snacking that actually does you good.": "ప్రతి వంటకానికి మూలంలో సంప్రదాయ ధాన్యాలు — నిజంగా మీకు మేలు చేసే స్నాకింగ్ కోసం.",
    "Made fresh to order": "ఆర్డర్ ప్రకారం తాజాగా తయారీ",
    "Every order is packed close to your delivery date — not stockpiled months in advance.": "ప్రతి ఆర్డర్ మీ డెలివరీ తేదీకి దగ్గరగా ప్యాక్ చేయబడుతుంది — నెలల ముందే నిల్వ చేసినది కాదు.",
    "Our product video is coming soon": "మా ప్రొడక్ట్ వీడియో త్వరలో రాబోతోంది",
    "Check back shortly": "కొద్దిసేపట్లో మళ్ళీ చూడండి",

    // Footer
    "Good Food | Good Health | Good Life": "మంచి ఆహారం | మంచి ఆరోగ్యం | మంచి జీవితం",
    "Address": "చిరునామా",
    "AS Rao Nagar, Sainikpuri, Secunderabad, Telangana – 500094": "ఏఎస్ రావు నగర్, సైనిక్\u200cపురి, సికింద్రాబాద్, తెలంగాణ – 500094",
    "Phone": "ఫోన్",
    "Email": "ఈమెయిల్",
    "Choose Natural.": "సహజమైనదే ఎంచుకోండి.",
    "Live Better.": "మెరుగ్గా జీవించండి.",
    // Contact
    "GET IN TOUCH": "మమ్మల్ని సంప్రదించండి",
    "We'd love to hear from you": "మీ నుండి వినడానికి మేము ఆసక్తిగా ఉన్నాము",
    "Questions about an order, bulk enquiries, or just want to say hello — reach us any of these ways.": "ఆర్డర్ గురించి ప్రశ్నలు, బల్క్ ఎంక్వైరీలు, లేదా కేవలం హలో చెప్పాలనుకున్నా — ఈ మార్గాలలో ఏదైనా ద్వారా మమ్మల్ని చేరండి.",
    "CONTACT": "సంప్రదింపు",
    "Reach Us": "మమ్మల్ని చేరండి",
    "Call Us": "మాకు కాల్ చేయండి",
    "Mon–Sat, 9:00 AM – 7:00 PM": "సోమ–శని, ఉదయం 9:00 – సాయంత్రం 7:00",
    "WhatsApp": "వాట్సాప్",
    "Fastest way to reach us — chat or place an order directly.": "మమ్మల్ని చేరడానికి వేగవంతమైన మార్గం — చాట్ చేయండి లేదా నేరుగా ఆర్డర్ ఇవ్వండి.",
    "We reply within a day.": "మేము ఒక రోజులోపు బదులిస్తాము.",
    "Visit / Delivery Area": "సందర్శన / డెలివరీ ప్రాంతం",

    // Home
    "Choose Natural. Live Better.": "సహజమైనదే ఎంచుకోండి. మెరుగ్గా జీవించండి.",
    "TAP TO CONTINUE": "కొనసాగించడానికి తాకండి",
    "CHOOSE NATURAL · LIVE BETTER": "సహజమైనదే ఎంచుకోండి · మెరుగ్గా జీవించండి",
    "Millets, quinoa and ragi, turned into snacks worth trusting": "చిరుధాన్యాలు, క్వినోవా, రాగులు — నమ్మదగిన స్నాక్స్\u200cగా",
    "Small-batch snacks made in Secunderabad with no preservatives and no shortcuts — quality you can trust, purity you can taste.": "సికింద్రాబాద్\u200cలో చిన్న బ్యాచ్\u200cలలో తయారైన స్నాక్స్ — ప్రిజర్వేటివ్\u200cలు లేవు, షార్ట్\u200cకట్\u200cలు లేవు — మీరు నమ్మగల నాణ్యత, మీరు రుచి చూడగల స్వచ్ఛత.",
    "Explore Products": "ఉత్పత్తులను చూడండి",
    "NATURAL": "సహజం",
    "Ragi Chips": "రాగి చిప్స్",
    "NATURALLY BAKED": "సహజంగా బేక్ చేసినవి",
    "BEST SELLER": "బెస్ట్ సెల్లర్",
    "12X Crunch": "12X క్రంచ్",
    "MULTIGRAIN SNACK": "మల్టీగ్రెయిన్ స్నాక్",
    "Read our full story & process →": "మా పూర్తి కథ & తయారీ విధానం చదవండి →",
    "OUR RANGE": "మా శ్రేణి",
    "Snack Categories": "స్నాక్ విభాగాలు",
    "Crunch": "క్రంచ్",
    "Our signature multigrain crunch mixes — the Vasista best-seller.": "మా ప్రత్యేకమైన మల్టీగ్రెయిన్ క్రంచ్ మిక్స్\u200cలు — వసిష్ఠ బెస్ట్ సెల్లర్.",
    "Chips": "చిప్స్",
    "Ragi and millet chips, naturally baked, never deep fried.": "రాగి, చిరుధాన్యాల చిప్స్ — సహజంగా బేక్ చేసినవి, ఎప్పుడూ డీప్ ఫ్రై చేయనివి.",
    "Mixes": "మిక్స్\u200cలు",
    "Everyday snack mixes for tea-time, tiffin boxes and travel.": "టీ టైమ్, టిఫిన్ బాక్స్\u200cలు, ప్రయాణాల కోసం రోజువారీ స్నాక్ మిక్స్\u200cలు.",
    "Nuts & Beans": "నట్స్ & బీన్స్",
    "Roasted nuts and protein-rich beans, lightly seasoned.": "కాల్చిన గింజలు, ప్రోటీన్ అధికంగా ఉండే బీన్స్ — తేలికగా మసాలా వేసినవి.",
    "Explore Full Menu": "పూర్తి మెనూను చూడండి",

    // Login / signup
    "WELCOME BACK": "తిరిగి స్వాగతం",
    "Log in to your account": "మీ ఖాతాలో లాగిన్ అవ్వండి",
    "Faster checkout with your saved details.": "మీ సేవ్ చేసిన వివరాలతో వేగవంతమైన చెక్\u200cఅవుట్.",
    "Email*": "ఈమెయిల్*",
    "Please enter a valid email.": "దయచేసి సరైన ఈమెయిల్ నమోదు చేయండి.",
    "Password*": "పాస్\u200cవర్డ్*",
    "Please enter your password.": "దయచేసి మీ పాస్\u200cవర్డ్ నమోదు చేయండి.",
    "Log In": "లాగిన్",
    "Log in / Sign up": "లాగిన్ / సైన్ అప్",
    "Login with OTP": "OTP తో లాగిన్",
    "Email me a link": "ఈమెయిల్ లింక్ పంపండి",
    "Log in with OTP": "OTP తో లాగిన్ అవ్వండి",
    "We'll text a 6-digit code to your mobile number.": "మీ మొబైల్ నంబర్‌కు 6 అంకెల కోడ్ SMS చేస్తాము.",
    "Mobile number*": "మొబైల్ నంబర్*",
    "10-digit mobile number": "10 అంకెల మొబైల్ నంబర్",
    "Enter a valid 10-digit mobile number.": "సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    "Send OTP": "OTP పంపండి",
    "Enter OTP*": "OTP నమోదు చేయండి*",
    "6-digit code": "6 అంకెల కోడ్",
    "Enter the 6-digit code.": "6 అంకెల కోడ్ నమోదు చేయండి.",
    "Verify & Log in": "ధృవీకరించి లాగిన్ అవ్వండి",
    "Resend OTP": "OTP మళ్ళీ పంపండి",
    "Change number": "నంబర్ మార్చండి",
    "← Back to other login options": "← ఇతర లాగిన్ ఎంపికలకు తిరిగి వెళ్ళండి",
    "Log in with an email link": "ఈమెయిల్ లింక్‌తో లాగిన్ అవ్వండి",
    "We'll email you a link. Click it to log in — no password needed.": "మేము మీకు లింక్ ఈమెయిల్ చేస్తాము. దానిపై క్లిక్ చేసి లాగిన్ అవ్వండి — పాస్‌వర్డ్ అవసరం లేదు.",
    "Send login link": "లాగిన్ లింక్ పంపండి",
    "Login link sent. Check your inbox (and spam folder).": "లాగిన్ లింక్ పంపబడింది. మీ ఇన్‌బాక్స్ (మరియు స్పామ్ ఫోల్డర్) చూడండి.",
    "Signing you in…": "మిమ్మల్ని లాగిన్ చేస్తున్నాము…",
    "Sending…": "పంపుతున్నాము…",
    "Verifying…": "ధృవీకరిస్తున్నాము…",
    "Incorrect OTP. Please check and try again.": "OTP తప్పు. దయచేసి సరిచూసి మళ్ళీ ప్రయత్నించండి.",
    "This OTP has expired. Please request a new one.": "ఈ OTP గడువు ముగిసింది. దయచేసి కొత్తది అభ్యర్థించండి.",
    "Too many attempts. Please wait a while and try again.": "చాలా ప్రయత్నాలు జరిగాయి. దయచేసి కాసేపు వేచి మళ్ళీ ప్రయత్నించండి.",
    "This login link is invalid or has expired. Please request a new one.": "ఈ లాగిన్ లింక్ చెల్లదు లేదా గడువు ముగిసింది. దయచేసి కొత్తది అభ్యర్థించండి.",
    "Couldn't complete OTP login. Please try again.": "OTP లాగిన్ పూర్తి కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    "Couldn't complete email login. Please try again.": "ఈమెయిల్ లాగిన్ పూర్తి కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    "Continue with Google": "Google తో కొనసాగండి",
    "or": "లేదా",
    "Google sign-in failed. Please try again.": "Google సైన్-ఇన్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    "Your browser blocked the Google window. Please allow pop-ups for this site and try again.": "మీ బ్రౌజర్ Google విండోను బ్లాక్ చేసింది. దయచేసి ఈ సైట్‌కు పాప్-అప్‌లను అనుమతించి మళ్ళీ ప్రయత్నించండి.",
    "An account with this email already exists. Log in with your email and password.": "ఈ ఈమెయిల్‌తో ఖాతా ఇప్పటికే ఉంది. మీ ఈమెయిల్ మరియు పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి.",
    "Forgot password?": "పాస్\u200cవర్డ్ మర్చిపోయారా?",
    "New here?": "ఇక్కడ కొత్తవారా?",
    "Create an account": "ఖాతా సృష్టించండి",
    "JOIN US": "మాతో చేరండి",
    "Create your account": "మీ ఖాతాను సృష్టించండి",
    "Save your details once, order faster every time.": "మీ వివరాలను ఒక్కసారి సేవ్ చేయండి, ప్రతిసారీ వేగంగా ఆర్డర్ చేయండి.",
    "Full Name*": "పూర్తి పేరు*",
    "Please enter your name.": "దయచేసి మీ పేరు నమోదు చేయండి.",
    "Phone Number*": "ఫోన్ నంబర్*",
    "Please enter a valid 10-digit number.": "దయచేసి సరైన 10 అంకెల నంబర్ నమోదు చేయండి.",
    "Password must be at least 6 characters.": "పాస్\u200cవర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.",
    "Confirm Password*": "పాస్\u200cవర్డ్ నిర్ధారించండి*",
    "Passwords do not match.": "పాస్\u200cవర్డ్\u200cలు సరిపోలడం లేదు.",
    "Create Account": "ఖాతా సృష్టించండి",
    "Already have an account?": "ఇప్పటికే ఖాతా ఉందా?",
    "Log in": "లాగిన్ అవ్వండి",
    "Logging in…": "లాగిన్ అవుతోంది…",
    "Creating account…": "ఖాతా సృష్టిస్తోంది…",
    "Something went wrong. Please try again.": "ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    "Incorrect email or password.": "ఈమెయిల్ లేదా పాస్\u200cవర్డ్ తప్పు.",
    "Please enter a valid email address.": "దయచేసి సరైన ఈమెయిల్ చిరునామా నమోదు చేయండి.",
    "Too many attempts. Please wait a moment and try again.": "చాలా ఎక్కువ ప్రయత్నాలు. దయచేసి కొద్దిసేపు వేచి ఉండి మళ్ళీ ప్రయత్నించండి.",
    "Enter your email above first, then click \"Forgot password?\" again.": "ముందు పైన మీ ఈమెయిల్ నమోదు చేసి, ఆపై \"పాస్\u200cవర్డ్ మర్చిపోయారా?\" మళ్ళీ క్లిక్ చేయండి.",
    "Couldn't send reset email. Please check the address and try again.": "రీసెట్ ఈమెయిల్ పంపలేకపోయాము. దయచేసి చిరునామాను సరిచూసి మళ్ళీ ప్రయత్నించండి.",
    "An account with this email already exists.": "ఈ ఈమెయిల్\u200cతో ఇప్పటికే ఖాతా ఉంది.",
    "Password is too weak.": "పాస్\u200cవర్డ్ చాలా బలహీనంగా ఉంది.",

    // Profile
    "YOUR ACCOUNT": "మీ ఖాతా",
    "Profile & Settings": "ప్రొఫైల్ & సెట్టింగ్\u200cలు",
    "Update your details or sign out below.": "మీ వివరాలను అప్\u200cడేట్ చేయండి లేదా క్రింద సైన్ అవుట్ అవ్వండి.",
    "PROFILE": "ప్రొఫైల్",
    "Your details": "మీ వివరాలు",
    "(can't be changed)": "(మార్చలేరు)",
    "Save Changes": "మార్పులను సేవ్ చేయండి",
    "SETTINGS": "సెట్టింగ్\u200cలు",
    "Account settings": "ఖాతా సెట్టింగ్\u200cలు",
    "Send me a password reset email": "పాస్\u200cవర్డ్ రీసెట్ ఈమెయిల్ పంపండి",
    "Log Out": "లాగ్ అవుట్",
    "Saving…": "సేవ్ అవుతోంది…",
    "Your details have been updated.": "మీ వివరాలు అప్\u200cడేట్ చేయబడ్డాయి.",
    "Couldn't save your changes. Please try again.": "మీ మార్పులను సేవ్ చేయలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    "Couldn't send reset email. Please try again.": "రీసెట్ ఈమెయిల్ పంపలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి.",

    // Order page
    "ORDER ONLINE": "ఆన్\u200cలైన్\u200cలో ఆర్డర్ చేయండి",
    "Pick your snacks, we'll bring them home": "మీ స్నాక్స్ ఎంచుకోండి, మేము ఇంటికి తెస్తాము",
    "Choose quantities below, add your delivery details, and send your order straight to us on WhatsApp.": "క్రింద పరిమాణాలను ఎంచుకోండి, మీ డెలివరీ వివరాలను జోడించండి, మీ ఆర్డర్\u200cను నేరుగా వాట్సాప్\u200cలో మాకు పంపండి.",
    "Eatables": "తినుబండారాలు",
    "Small-batch millet, ragi and quinoa snacks, roasted nuts and traditional mixtures — made fresh, delivered to your door.": "చిన్న బ్యాచ్\u200cలలో తయారైన చిరుధాన్యాలు, రాగులు, క్వినోవా స్నాక్స్, కాల్చిన గింజలు, సంప్రదాయ మిక్స్\u200cలు — తాజాగా తయారు చేసి, మీ ఇంటి వద్దకే.",
    "All": "అన్నీ",
    "Delivery Details": "డెలివరీ వివరాలు",
    "Tell us where to deliver your order.": "మీ ఆర్డర్\u200cను ఎక్కడ డెలివరీ చేయాలో చెప్పండి.",
    "Delivery Address*": "డెలివరీ చిరునామా*",
    "Please enter your delivery address.": "దయచేసి మీ డెలివరీ చిరునామా నమోదు చేయండి.",
    "Pick location on map": "మ్యాప్\u200cలో ప్రదేశాన్ని ఎంచుకోండి",
    "City*": "నగరం*",
    "Please enter your city.": "దయచేసి మీ నగరం నమోదు చేయండి.",
    "Pincode*": "పిన్\u200cకోడ్*",
    "Please enter a valid 6-digit pincode.": "దయచేసి సరైన 6 అంకెల పిన్\u200cకోడ్ నమోదు చేయండి.",
    "Landmark": "ల్యాండ్\u200cమార్క్",
    "(optional)": "(ఐచ్ఛికం)",
    "Payment Method": "చెల్లింపు విధానం",
    "Cash on Delivery": "డెలివరీ సమయంలో నగదు",
    "Pay via UPI": "UPI ద్వారా చెల్లించండి",
    "UPI ID:": "UPI ఐడి:",
    "Copy": "కాపీ",
    "Copied!": "కాపీ అయింది!",
    "Scan the QR code (it's pre-filled with your order total) or pay manually to the UPI ID above, then share your transaction reference below so we can confirm your payment quickly.": "QR కోడ్\u200cను స్కాన్ చేయండి (ఇందులో మీ ఆర్డర్ మొత్తం ముందే నింపబడింది) లేదా పై UPI ఐడికి మాన్యువల్\u200cగా చెల్లించండి, ఆపై మేము మీ చెల్లింపును త్వరగా నిర్ధారించడానికి మీ ట్రాన్సాక్షన్ రిఫరెన్స్\u200cను క్రింద పంచుకోండి.",
    "UPI Transaction Ref": "UPI ట్రాన్సాక్షన్ రిఫరెన్స్",
    "Please fill in all required delivery details before placing your order.": "మీ ఆర్డర్ ఇచ్చే ముందు దయచేసి అవసరమైన అన్ని డెలివరీ వివరాలను నింపండి.",
    "Order on WhatsApp": "వాట్సాప్\u200cలో ఆర్డర్ చేయండి",
    "Tip: pick quantities above and your order list is sent automatically.": "చిట్కా: పైన పరిమాణాలను ఎంచుకోండి, మీ ఆర్డర్ జాబితా ఆటోమేటిక్\u200cగా పంపబడుతుంది.",
    "Fill in your delivery details above, then send your order.": "పైన మీ డెలివరీ వివరాలను నింపి, ఆపై మీ ఆర్డర్\u200cను పంపండి.",
    "Current location": "ప్రస్తుత స్థానం",
    "Order will be delivered here": "ఆర్డర్ ఇక్కడికి డెలివరీ చేయబడుతుంది",
    "Move the map to select location": "ప్రదేశాన్ని ఎంచుకోవడానికి మ్యాప్\u200cను కదిలించండి",
    "Auto-detected — please double-check the city & pincode after confirming.": "ఆటోమేటిక్\u200cగా గుర్తించబడింది — నిర్ధారించిన తర్వాత నగరం & పిన్\u200cకోడ్\u200cను మరోసారి సరిచూడండి.",
    "Confirm & proceed": "నిర్ధారించి కొనసాగండి",
    "Locating…": "స్థానాన్ని గుర్తిస్తోంది…",
    "Finding your location…": "మీ స్థానాన్ని కనుగొంటోంది…",
    "Couldn't auto-detect address": "చిరునామాను ఆటోమేటిక్\u200cగా గుర్తించలేకపోయాము",
    "That's OK — confirm this pin and type your address below.": "పర్వాలేదు — ఈ పిన్\u200cను నిర్ధారించి, మీ చిరునామాను క్రింద టైప్ చేయండి.",
    "Couldn't get your current location. Please allow location access or search above.": "మీ ప్రస్తుత స్థానాన్ని పొందలేకపోయాము. దయచేసి లొకేషన్ యాక్సెస్\u200cను అనుమతించండి లేదా పైన శోధించండి.",

    // Cart dropdown
    "You haven't added any items yet.": "మీరు ఇంకా ఏ వస్తువులనూ జోడించలేదు.",
    "Select items in Products": "ఉత్పత్తులలో వస్తువులను ఎంచుకోండి",
    "Total": "మొత్తం",
    "Go to checkout": "చెక్\u200cఅవుట్\u200cకు వెళ్ళండి",

    // Product names
    "Mexican Bites": "మెక్సికన్ బైట్స్",
    "Millet Mixture (Puff)": "మిల్లెట్ మిక్చర్ (పఫ్)",
    "Multi Millet Chips": "మల్టీ మిల్లెట్ చిప్స్",
    "Nutri Nuts": "న్యూట్రి నట్స్",
    "Oats Chips": "ఓట్స్ చిప్స్",
    "Pro Beans": "ప్రో బీన్స్",
    "Quinoa Chips": "క్వినోవా చిప్స్",
    "Quinoa Flakes Mix": "క్వినోవా ఫ్లేక్స్ మిక్స్",

    // Button / field labels set by scripts or attributes
    "Decrease quantity": "పరిమాణం తగ్గించండి",
    "Increase quantity": "పరిమాణం పెంచండి",
    "Open menu": "మెనూ తెరవండి",
    "Breadcrumb": "బ్రెడ్\u200cక్రంబ్",
    "Filter by category": "విభాగం ప్రకారం ఫిల్టర్ చేయండి",
    "Search products": "ఉత్పత్తులను శోధించండి",
    "Search products…": "ఉత్పత్తులను శోధించండి…",
    "Close image": "చిత్రాన్ని మూసివేయండి",
    "Choose delivery location on map": "మ్యాప్\u200cలో డెలివరీ ప్రదేశాన్ని ఎంచుకోండి",
    "Close map": "మ్యాప్\u200cను మూసివేయండి",
    "Search": "శోధించండి",
    "Search an area or address": "ప్రాంతం లేదా చిరునామా శోధించండి",
    "Scan to pay via UPI": "UPI ద్వారా చెల్లించడానికి స్కాన్ చేయండి",
    "Vasista Food and Traders": "వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్",
    "Vasista Food and Traders snacks": "వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్ స్నాక్స్",
    "Vasista Food and Traders location": "వసిష్ఠ ఫుడ్ అండ్ ట్రేడర్స్ స్థానం",
    "Your password": "మీ పాస్\u200cవర్డ్",
    "Your name": "మీ పేరు",
    "At least 6 characters": "కనీసం 6 అక్షరాలు",
    "Re-enter your password": "మీ పాస్\u200cవర్డ్\u200cను మళ్ళీ నమోదు చేయండి",
    "e.g. Priya Reddy": "ఉదా. ప్రియా రెడ్డి",
    "10-digit mobile number": "10 అంకెల మొబైల్ నంబర్",
    "House/flat no., street, area": "ఇంటి/ఫ్లాట్ నంబర్, వీధి, ప్రాంతం",
    "e.g. Secunderabad": "ఉదా. సికింద్రాబాద్",
    "6-digit pincode": "6 అంకెల పిన్\u200cకోడ్",
    "Nearby landmark, if any": "దగ్గరలోని ల్యాండ్\u200cమార్క్, ఉంటే"
  };

  // ---------- Patterns for text that contains numbers or names ----------
  var PATTERNS = [
    // "Order 3 items · ₹450"
    [/^Order (\d+) items?(?: \u00b7 (.+))?$/, function (m) {
      return m[1] + (m[1] === "1" ? " వస్తువును" : " వస్తువులను") + " ఆర్డర్ చేయండి" + (m[2] ? " \u00b7 " + m[2] : "");
    }],
    // "3% off"
    [/^(\d+)% off$/, function (m) { return m[1] + "% తగ్గింపు"; }],
    // "100g" or "100g (2)"  (size buttons)
    [/^(\d+)g(?: \((\d+)\))?$/, function (m) { return m[1] + " గ్రా" + (m[2] ? " (" + m[2] + ")" : ""); }],
    // "(100g)"  (cart panel)
    [/^\((\d+)g\)$/, function (m) { return "(" + m[1] + " గ్రా)"; }],
    // "View image of Ragi Chips"
    [/^View image of (.+)$/, function (m) { return tr(m[1]) + " చిత్రాన్ని చూడండి"; }],
    // Password reset confirmations
    [/^Password reset email sent to (.+)\. Check your inbox\.$/, function (m) {
      return "పాస్\u200cవర్డ్ రీసెట్ ఈమెయిల్ " + m[1] + " కు పంపబడింది. మీ ఇన్\u200cబాక్స్ చూడండి.";
    }],
    [/^Password reset email sent to (.+)\.$/, function (m) {
      return "పాస్\u200cవర్డ్ రీసెట్ ఈమెయిల్ " + m[1] + " కు పంపబడింది.";
    }],
    // "FSSAI Lic. No.: 1234..."
    [/^FSSAI Lic\. No\.: (.+)$/, function (m) { return "FSSAI లైసెన్స్ నం.: " + m[1]; }]
  ];

  function norm(s) {
    return s.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim();
  }

  // Returns the Telugu text, or null when there is no translation.
  function translate(s) {
    var key = norm(s);
    if (!key) return null;
    if (Object.prototype.hasOwnProperty.call(TE, key)) return TE[key];
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = key.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1](m);
    }
    return null;
  }
  function tr(s) { var r = translate(s); return r === null ? s : r; }

  // ---------- Page engine (browser only) ----------
  var lang = "en";
  var orig = typeof WeakMap !== "undefined" ? new WeakMap() : null;   // text node -> English
  var shown = typeof WeakMap !== "undefined" ? new WeakMap() : null;  // text node -> Telugu we wrote
  var aState = typeof WeakMap !== "undefined" ? new WeakMap() : null; // element -> {attr: {orig, shown}}
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  var ATTR_SEL = "[placeholder],[aria-label],[title],[alt]";
  var titleOrig = null;
  var observer = null;
  var btn = null;
  var fontLoaded = false;

  function skipEl(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "NOSCRIPT") return true;
    return !!el.closest("[data-no-translate]");
  }

  function keepSpaces(cur, out) {
    return cur.match(/^\s*/)[0] + out + cur.match(/\s*$/)[0];
  }

  function xText(node) {
    var cur = node.nodeValue;
    if (shown.get(node) === cur) return;            // already our translation
    if (skipEl(node.parentNode)) return;
    var out = translate(cur);
    orig.set(node, cur);
    if (out !== null) {
      var val = keepSpaces(cur, out);
      if (val !== cur) { shown.set(node, val); node.nodeValue = val; return; }
    }
    shown.delete(node);
  }

  function xAttr(el, name) {
    if (skipEl(el)) return;
    var cur = el.getAttribute(name);
    if (cur === null) return;
    var st = aState.get(el);
    if (st && st[name] && st[name].shown === cur) return;
    var out = translate(cur);
    if (!st) { st = {}; aState.set(el, st); }
    st[name] = { orig: cur, shown: null };
    if (out !== null && out !== cur) { st[name].shown = out; el.setAttribute(name, out); }
  }

  function xAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) if (el.hasAttribute(ATTRS[i])) xAttr(el, ATTRS[i]);
  }

  function eachText(root, fn) {
    if (root.nodeType === 3) { fn(root); return; }
    if (root.nodeType !== 1 || skipEl(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) fn(n);
  }

  function eachAttrEl(root, fn) {
    if (root.nodeType !== 1) return;
    fn(root);
    var list = root.querySelectorAll(ATTR_SEL);
    for (var i = 0; i < list.length; i++) fn(list[i]);
  }

  function translateAll() {
    eachText(document.body, xText);
    eachAttrEl(document.body, xAttrs);
    if (titleOrig === null) titleOrig = document.title;
    var t = translate(titleOrig);
    if (t !== null) document.title = t;
  }

  function restoreAll() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (shown.has(n) && shown.get(n) === n.nodeValue) { n.nodeValue = orig.get(n); shown.delete(n); }
    }
    var els = document.querySelectorAll(ATTR_SEL);
    for (var i = 0; i < els.length; i++) {
      var st = aState.get(els[i]);
      if (!st) continue;
      for (var a = 0; a < ATTRS.length; a++) {
        var rec = st[ATTRS[a]];
        if (rec && rec.shown !== null && els[i].getAttribute(ATTRS[a]) === rec.shown) {
          els[i].setAttribute(ATTRS[a], rec.orig);
          rec.shown = null;
        }
      }
    }
    if (titleOrig !== null) document.title = titleOrig;
  }

  // Translate content that the page creates later (product cards, cart panel, messages...).
  function startObserver() {
    if (observer || typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(function (muts) {
      if (lang !== "te") return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var nd = m.addedNodes[j];
            if (nd.nodeType === 3) xText(nd);
            else if (nd.nodeType === 1) { eachText(nd, xText); eachAttrEl(nd, xAttrs); }
          }
        } else if (m.type === "characterData") {
          xText(m.target);
        } else if (m.type === "attributes") {
          xAttr(m.target, m.attributeName);
        }
      }
    });
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  // Telugu needs its own fonts; load them only when Telugu is switched on.
  function ensureFont() {
    if (fontLoaded) return;
    fontLoaded = true;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Serif+Telugu:wght@500;600;700&display=swap";
    document.head.appendChild(l);
  }

  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  function ensureToggle() {
    if (btn) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "lang-toggle";
    btn.className = "lang-toggle";
    btn.setAttribute("data-no-translate", "");
    btn.innerHTML = GLOBE + "<span></span>";
    btn.addEventListener("click", function () { setLang(lang === "te" ? "en" : "te"); });

    var hamburger = document.getElementById("nav-toggle");
    var authHeader = document.querySelector(".auth-brand-header");
    if (hamburger && hamburger.parentNode) hamburger.parentNode.insertBefore(btn, hamburger);
    else if (authHeader) authHeader.appendChild(btn);
    else document.body.appendChild(btn);
  }

  function updateToggle() {
    if (!btn) return;
    btn.querySelector("span").textContent = lang === "te" ? "English" : "తెలుగు";
    btn.setAttribute("aria-label", lang === "te" ? "Switch to English" : "Switch to Telugu");
  }

  function setLang(next) {
    lang = next === "te" ? "te" : "en";
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage unavailable */ }
    document.documentElement.setAttribute("lang", lang);
    if (lang === "te") { ensureFont(); translateAll(); } else { restoreAll(); }
    updateToggle();
  }

  function init() {
    ensureToggle();
    startObserver();
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    setLang(saved === "te" ? "te" : "en");
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
    // Keep several open tabs in sync.
    window.addEventListener("storage", function (e) {
      if (e.key === KEY && e.newValue && e.newValue !== lang) setLang(e.newValue);
    });
  }

  // For alert() boxes and other text built in JavaScript: VasistaI18n.t("English text")
  if (typeof window !== "undefined") {
    window.VasistaI18n = {
      t: function (s) { return lang === "te" ? tr(s) : s; },
      lang: function () { return lang; },
      set: setLang
    };
  }
  // Lets the dictionary be checked from Node during development.
  if (typeof module !== "undefined" && module.exports) module.exports = { translate: translate, TE: TE };
})();
