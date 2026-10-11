# 91hwl site v1.11.9

MilkFrog downloads now come before game content. Buyers enter their delivery code to request installer/portable links and later updates; the desktop app needs no activation. The three game routes, language/theme preferences and detail pages remain available below.

Download verification belongs to the separately deployed private delivery-ledger gateway. Only allocated, active order codes qualify; unused stock and closed/refunded orders are denied. Signed download links expire after 15 minutes, and a secure browser cookie can retain access for 90 days. No plaintext code is stored in localStorage or sent through URL parameters. The website does not expose inventory/admin routes or static installer URLs.

No game rules or saves change. Components remain independently versioned.

## 发布检查修正

下载输入框与下载区检查只应用于首页；游戏详情页沿用自己的内容检查。新增回归检查直接运行构建包的首页、游戏详情与信任页面检查，验证缺少首页输入框时仍会拒绝发布。
