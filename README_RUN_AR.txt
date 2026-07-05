طريقة تشغيل النسخة v165
=======================

هذه النسخة تحتوي على ملفات الواجهة الأمامية وملفات Supabase المرافقة:
- index.html
- style.css
- app.js
- sar-symbol.png
- supabase/functions/admin-create-user/index.ts
- ملفات SQL وملفات README الخاصة بالإصدارات السابقة

التشغيل السريع:
1) افتح index.html مباشرة في المتصفح.

أو شغل خادما محليا من داخل المجلد:
python3 -m http.server 4173

ثم افتح:
http://localhost:4173

ملاحظات:
- البيانات المحلية تحفظ في IndexedDB و localStorage.
- النسخة تحتوي إعدادات Supabase وتسجيل دخول وإدارة مستخدمين عند تجهيز ملفات SQL و Edge Function.
- لتحديث صلاحيات المستخدمين من الموقع، انشر Edge Function الموجودة في:
  supabase/functions/admin-create-user/index.ts
- شغل ملفات SQL المطلوبة في Supabase SQL Editor حسب حالة قاعدة البيانات لديك.
- للمرفقات تحديدا شغل الملف التالي مرة واحدة:
  SUPABASE_ATTACHMENTS_STORAGE_SQL.sql
  هذا الملف ينشئ جدول attachments و buckets وسياسات Storage حتى تبقى المرفقات ظاهرة بعد تسجيل الخروج والدخول.
- خط Almarai من Google Fonts يحتاج اتصالا بالإنترنت؛ بدون الإنترنت سيستخدم المتصفح خطا بديلا.
- تم اختبار منطق المرفقات مع سيناريو إعادة التحميل وفشل قراءة جدول attachments للتأكد من عدم مسح أرقام المرفقات من السجلات.
