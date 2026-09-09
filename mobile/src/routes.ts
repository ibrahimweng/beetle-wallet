/* Every screen in the product, with the frame in the Figma file it is drawn
   from. Generated from the web registry and test/figma-map.json, so the two
   can never disagree about what exists. A screen with a frame and no
   component yet is not lost: the placeholder names its frame. */

export type Route = "checking" | "iwillnot" | "misheard" | "alreadygone" | "confirm" | "noface" | "short" | "pending" | "failed" | "reversed" | "wrong" | "recall" | "amend" | "disputeopen" | "disputeend" | "nonetwork" | "rule" | "rules" | "settings" | "lock" | "limits" | "limitstop" | "devices" | "lostphone" | "newcode" | "home" | "agentchat" | "ask" | "scan" | "typed" | "pay" | "chat" | "donesend" | "share" | "asksvc" | "typedbuy" | "buy" | "confirmbuy" | "done" | "sharebuy" | "askreq" | "typedask" | "request" | "sent" | "scanbill" | "meter" | "confirmmeter" | "power" | "sharepower" | "bills" | "powerpay" | "receive" | "ways" | "mycode" | "services" | "airtime" | "loan" | "card" | "history" | "answer" | "donein" | "sharein" | "doneflat" | "shareflat" | "doneshop" | "shareshop" | "donesub" | "sharesub" | "donecard" | "sharecard" | "actions" | "draft" | "health" | "goal" | "saverule" | "paused" | "dollars" | "convert" | "converted" | "payfrom" | "paydollars" | "start" | "number" | "code" | "nin" | "who" | "face" | "passcode" | "ready" | "nomatch" | "finish" | "idcard" | "income" | "full" | "firsthome" | "firstask" | "emptyactivity" | "emptygoal" | "signin" | "signcode";

export type RouteInfo = { title: string; act: string; section: string; frame: string | null; design: string | null };

export const ROUTES: Record<Route, RouteInfo> = {
 "checking": {
  "title": "Checking",
  "act": "One · It goes wrong",
  "section": "When it is not sure",
  "frame": "973:20644",
  "design": "Checking"
 },
 "iwillnot": {
  "title": "I will not do this one",
  "act": "One · It goes wrong",
  "section": "When it is not sure",
  "frame": "973:20699",
  "design": "IWillNot"
 },
 "misheard": {
  "title": "Check this number",
  "act": "One · It goes wrong",
  "section": "When it heard you wrong",
  "frame": "957:20338",
  "design": "Misheard"
 },
 "alreadygone": {
  "title": "I sent it wrong",
  "act": "One · It goes wrong",
  "section": "When it heard you wrong",
  "frame": "957:20392",
  "design": "AlreadyGone"
 },
 "confirm": {
  "title": "Confirm",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "239:7762",
  "design": "Confirm"
 },
 "noface": {
  "title": "Face ID missed",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "331:9488",
  "design": "NoFace"
 },
 "short": {
  "title": "Not enough",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "208:88",
  "design": "Short"
 },
 "pending": {
  "title": "Still on its way",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "206:2",
  "design": "Pending"
 },
 "failed": {
  "title": "It did not go",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "206:77",
  "design": "Failed"
 },
 "reversed": {
  "title": "It came back",
  "act": "One · It goes wrong",
  "section": "When it does not go",
  "frame": "206:153",
  "design": "Reversed"
 },
 "wrong": {
  "title": "What went wrong?",
  "act": "One · It goes wrong",
  "section": "When it was wrong",
  "frame": "206:225",
  "design": "Wrong"
 },
 "recall": {
  "title": "Asking for it back",
  "act": "One · It goes wrong",
  "section": "When it was wrong",
  "frame": "207:2",
  "design": "Recall"
 },
 "amend": {
  "title": "Change the amount",
  "act": "One · It goes wrong",
  "section": "When it was wrong",
  "frame": "222:148",
  "design": "Amend"
 },
 "disputeopen": {
  "title": "Your dispute",
  "act": "One · It goes wrong",
  "section": "Following a dispute",
  "frame": "959:20338",
  "design": "DisputeOpen"
 },
 "disputeend": {
  "title": "The dispute is closed",
  "act": "One · It goes wrong",
  "section": "Following a dispute",
  "frame": "959:20393",
  "design": "DisputeEnd"
 },
 "nonetwork": {
  "title": "You are offline",
  "act": "One · It goes wrong",
  "section": "When the network is not there",
  "frame": "959:20420",
  "design": "NoNetwork"
 },
 "rule": {
  "title": "Set this up?",
  "act": "Two · It decides",
  "section": "What runs on its own",
  "frame": "207:101",
  "design": "Rule"
 },
 "rules": {
  "title": "Standing instructions",
  "act": "Two · It decides",
  "section": "What runs on its own",
  "frame": "207:136",
  "design": "Rules"
 },
 "settings": {
  "title": "Settings",
  "act": "Two · It decides",
  "section": "What you set",
  "frame": "272:8208",
  "design": "Settings"
 },
 "lock": {
  "title": "Lock and privacy",
  "act": "Two · It decides",
  "section": "What you set",
  "frame": "271:8211",
  "design": "Lock"
 },
 "limits": {
  "title": "Spending limits",
  "act": "Two · It decides",
  "section": "What you set",
  "frame": "223:206",
  "design": "Limits"
 },
 "limitstop": {
  "title": "Past your own limit",
  "act": "Two · It decides",
  "section": "What you set",
  "frame": "224:2",
  "design": "LimitStop"
 },
 "devices": {
  "title": "Devices",
  "act": "Two · It decides",
  "section": "What you set",
  "frame": "224:53",
  "design": "Devices"
 },
 "lostphone": {
  "title": "Not your phone",
  "act": "Two · It decides",
  "section": "When the phone is gone",
  "frame": "957:20438",
  "design": "LostPhone"
 },
 "newcode": {
  "title": "A new passcode",
  "act": "Two · It decides",
  "section": "When the phone is gone",
  "frame": "957:20481",
  "design": "NewCode"
 },
 "home": {
  "title": "Home",
  "act": "Three · It works",
  "section": "Home and the ask bar",
  "frame": "225:3",
  "design": "Home screen"
 },
 "agentchat": {
  "title": "Ask Beetle",
  "act": "Three · It works",
  "section": "Home and the ask bar",
  "frame": null,
  "design": null
 },
 "ask": {
  "title": "Ask (voice)",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "205:2",
  "design": "Ask"
 },
 "scan": {
  "title": "Scan (photo)",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "209:2",
  "design": "Scan"
 },
 "typed": {
  "title": "Typed",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "209:209",
  "design": "Typed"
 },
 "pay": {
  "title": "Send money (form)",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "332:9851",
  "design": "Pay"
 },
 "chat": {
  "title": "Chat",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "205:57",
  "design": "Chat"
 },
 "donesend": {
  "title": "All done",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "239:7829",
  "design": "DoneSend"
 },
 "share": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Sending money",
  "frame": "472:10886",
  "design": "Share"
 },
 "asksvc": {
  "title": "Ask (voice)",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "225:2620",
  "design": "AskSvc"
 },
 "typedbuy": {
  "title": "Typed",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "225:2973",
  "design": "TypedBuy"
 },
 "buy": {
  "title": "Buy data",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "221:165",
  "design": "Buy"
 },
 "confirmbuy": {
  "title": "Confirm",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "239:8474",
  "design": "ConfirmBuy"
 },
 "done": {
  "title": "All done",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "239:8418",
  "design": "Done"
 },
 "sharebuy": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Buying something",
  "frame": "472:11590",
  "design": "ShareBuy"
 },
 "askreq": {
  "title": "Ask (voice)",
  "act": "Three · It works",
  "section": "Asking to be paid",
  "frame": "225:1551",
  "design": "AskReq"
 },
 "typedask": {
  "title": "Typed",
  "act": "Three · It works",
  "section": "Asking to be paid",
  "frame": "225:1928",
  "design": "TypedAsk"
 },
 "request": {
  "title": "Request",
  "act": "Three · It works",
  "section": "Asking to be paid",
  "frame": "225:1606",
  "design": "Request"
 },
 "sent": {
  "title": "Request sent",
  "act": "Three · It works",
  "section": "Asking to be paid",
  "frame": "239:8294",
  "design": "Sent"
 },
 "scanbill": {
  "title": "Scan a bill",
  "act": "Three · It works",
  "section": "Pay a bill from a photo",
  "frame": "222:97",
  "design": "ScanBill"
 },
 "meter": {
  "title": "What I read",
  "act": "Three · It works",
  "section": "Pay a bill from a photo",
  "frame": "210:2",
  "design": "Meter"
 },
 "confirmmeter": {
  "title": "Confirm",
  "act": "Three · It works",
  "section": "Pay a bill from a photo",
  "frame": "210:71",
  "design": "ConfirmMeter"
 },
 "power": {
  "title": "Bill paid",
  "act": "Three · It works",
  "section": "Pay a bill from a photo",
  "frame": "490:13497",
  "design": "Power"
 },
 "sharepower": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Pay a bill from a photo",
  "frame": "490:13595",
  "design": "SharePower"
 },
 "bills": {
  "title": "Bills",
  "act": "Three · It works",
  "section": "Pay a bill the ordinary way",
  "frame": "217:67",
  "design": "Bills"
 },
 "powerpay": {
  "title": "Pay a bill",
  "act": "Three · It works",
  "section": "Pay a bill the ordinary way",
  "frame": "217:2",
  "design": "PowerPay"
 },
 "receive": {
  "title": "Receive",
  "act": "Three · It works",
  "section": "Be paid from home",
  "frame": "332:9555",
  "design": "Receive"
 },
 "ways": {
  "title": "Three ways to be paid",
  "act": "Three · It works",
  "section": "Be paid from home",
  "frame": "222:199",
  "design": "Ways"
 },
 "mycode": {
  "title": "Your code",
  "act": "Three · It works",
  "section": "Be paid from home",
  "frame": "221:2",
  "design": "MyCode"
 },
 "services": {
  "title": "All services",
  "act": "Three · It works",
  "section": "The services drawer",
  "frame": "215:2",
  "design": "Services"
 },
 "airtime": {
  "title": "Buy data",
  "act": "Three · It works",
  "section": "The services drawer",
  "frame": "215:170",
  "design": "Airtime"
 },
 "loan": {
  "title": "Borrow",
  "act": "Three · It works",
  "section": "The services drawer",
  "frame": "217:181",
  "design": "Loan"
 },
 "card": {
  "title": "Virtual card",
  "act": "Three · It works",
  "section": "The services drawer",
  "frame": "218:2",
  "design": "Card"
 },
 "history": {
  "title": "History",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": "501:14267",
  "design": "History"
 },
 "answer": {
  "title": "Airtime and data",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": "218:84",
  "design": "Answer"
 },
 "donein": {
  "title": "Money in",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": "490:12465",
  "design": "DoneIn"
 },
 "sharein": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": "490:12558",
  "design": "ShareIn"
 },
 "doneflat": {
  "title": "Flat deposit",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "shareflat": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "doneshop": {
  "title": "Grocery shopping",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "shareshop": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "donesub": {
  "title": "Netflix subscription",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "sharesub": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "donecard": {
  "title": "Card payment",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "sharecard": {
  "title": "Share",
  "act": "Three · It works",
  "section": "Look at what happened",
  "frame": null,
  "design": null
 },
 "actions": {
  "title": "The button",
  "act": "Three · It works",
  "section": "The button",
  "frame": "204:85",
  "design": "Actions"
 },
 "draft": {
  "title": "Draft",
  "act": "Three · It works",
  "section": "The button",
  "frame": "222:2",
  "design": "Draft"
 },
 "health": {
  "title": "Money health",
  "act": "Three · It works",
  "section": "How the habits add up",
  "frame": "223:2",
  "design": "Health"
 },
 "goal": {
  "title": "Holiday",
  "act": "Three · It works",
  "section": "Putting money away",
  "frame": "219:2",
  "design": "Goal"
 },
 "saverule": {
  "title": "The rule that feeds it",
  "act": "Three · It works",
  "section": "Putting money away",
  "frame": "224:122",
  "design": "SaveRule"
 },
 "paused": {
  "title": "Paused",
  "act": "Three · It works",
  "section": "Putting money away",
  "frame": "204:2",
  "design": "Paused"
 },
 "dollars": {
  "title": "Dollars",
  "act": "Three · It works",
  "section": "Keep some in dollars",
  "frame": "279:8211",
  "design": "Dollars"
 },
 "convert": {
  "title": "Convert",
  "act": "Three · It works",
  "section": "Keep some in dollars",
  "frame": "279:8299",
  "design": "Convert"
 },
 "converted": {
  "title": "Converted",
  "act": "Three · It works",
  "section": "Keep some in dollars",
  "frame": "296:8850",
  "design": "Converted"
 },
 "payfrom": {
  "title": "Pay from",
  "act": "Three · It works",
  "section": "Pay from your dollars",
  "frame": "301:9464",
  "design": "PayFrom"
 },
 "paydollars": {
  "title": "Send from dollars",
  "act": "Three · It works",
  "section": "Pay from your dollars",
  "frame": "301:9565",
  "design": "PayDollars"
 },
 "start": {
  "title": "Opening one",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "307:9497",
  "design": "Start"
 },
 "number": {
  "title": "Your number",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "307:9523",
  "design": "Number"
 },
 "code": {
  "title": "The code",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "307:9566",
  "design": "Code"
 },
 "nin": {
  "title": "Who you are",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "332:9915",
  "design": "Nin"
 },
 "who": {
  "title": "Is this you?",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "332:9966",
  "design": "Who"
 },
 "face": {
  "title": "Your face",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "309:9491",
  "design": "Face"
 },
 "passcode": {
  "title": "A passcode",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "309:9532",
  "design": "Passcode"
 },
 "ready": {
  "title": "It is ready",
  "act": "Four · Getting in",
  "section": "Opening an account",
  "frame": "306:9534",
  "design": "Ready"
 },
 "nomatch": {
  "title": "Nothing came back",
  "act": "Four · Getting in",
  "section": "When the digits do not match",
  "frame": "333:10529",
  "design": "Nomatch"
 },
 "finish": {
  "title": "Where you live",
  "act": "Four · Getting in",
  "section": "Finishing setting up",
  "frame": "316:9491",
  "design": "Finish"
 },
 "idcard": {
  "title": "A photo of an ID",
  "act": "Four · Getting in",
  "section": "Finishing setting up",
  "frame": "316:9538",
  "design": "Idcard"
 },
 "income": {
  "title": "Where your money comes from",
  "act": "Four · Getting in",
  "section": "Finishing setting up",
  "frame": "317:9488",
  "design": "Income"
 },
 "full": {
  "title": "Everything is on",
  "act": "Four · Getting in",
  "section": "Finishing setting up",
  "frame": "317:9528",
  "design": "Full"
 },
 "firsthome": {
  "title": "The first home",
  "act": "Four · Getting in",
  "section": "The first day",
  "frame": "964:20807",
  "design": "FirstHome"
 },
 "firstask": {
  "title": "The first question",
  "act": "Four · Getting in",
  "section": "The first day",
  "frame": "964:21033",
  "design": "FirstAsk"
 },
 "emptyactivity": {
  "title": "Nothing yet",
  "act": "Four · Getting in",
  "section": "The first day",
  "frame": "964:21113",
  "design": "EmptyActivity"
 },
 "emptygoal": {
  "title": "No goal yet",
  "act": "Four · Getting in",
  "section": "The first day",
  "frame": "964:21229",
  "design": "EmptyGoal"
 },
 "signin": {
  "title": "Welcome back",
  "act": "Four · Getting in",
  "section": "Signing in again",
  "frame": "333:10437",
  "design": "Signin"
 },
 "signcode": {
  "title": "Six digits",
  "act": "Four · Getting in",
  "section": "Signing in again",
  "frame": "333:10479",
  "design": "Signcode"
 }
} as const;

export const routeList = Object.keys(ROUTES) as Route[];
