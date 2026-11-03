p = r"C:\Users\Administrator\Desktop\famishop\famishop-webstore\src\lib\i18n\index.tsx"
lines = open(p, encoding="utf-8").read().split("\n")
start = 758
# final Arabic values (use unicode escapes to avoid quote issues)
vals = [
    "x",  # placeholder
]
# We'll set them to simple ASCII markers first, then replace via edit tool? Instead, set final Arabic using chr
ar0 = "\u0645\u062c\u0645\u0648\u0639\u0627\u062a\u0646\u0627"  # مجموعاتنا
ar1 = "\u0627\u0644\u0648\u0638\u0627\u0626\u0641"  # الوظائف
ar2 = "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627"  # تواصل معنا
ar3 = "\u0627\u0644\u0634\u062d\u0646 \u0648\u0627\u0644\u062a\u0648\u0635\u064a\u0644"  # الشحن والتوصيل
ar4 = "\u0627\u0644\u0625\u0631\u062c\u0627\u0639 \u0648\u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f"  # الإرجاع والاسترداد
ar5 = "\u0637\u0644\u0628\u0627\u062a\u064a"  # طلباتي
ar6 = "\u062a\u062a\u0628\u0639 \u0637\u0644\u0628\u064a"  # تتبع طلبي
ar7 = "\u0637\u0631\u0642 \u0627\u0644\u062f\u0641\u0639"  # طرق الدفع
keys = ["footer.ourCollections","footer.careers","footer.contactUs","footer.shipping","footer.returns","footer.myOrders","footer.trackOrder","footer.paymentMethods"]
vals = [ar0,ar1,ar2,ar3,ar4,ar5,ar6,ar7]
for j in range(8):
    lines[start+j] = '      "%s": "%s",' % (keys[j], vals[j])
open(p, "w", encoding="utf-8").write("\n".join(lines))
print("done")
