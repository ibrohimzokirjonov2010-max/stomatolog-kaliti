-- Brend nomi yagona "StomaHub": platforma do'koni, platforma profili va buyurtmalardagi do'kon nomi (faqat ko'rinadigan matnlar).
-- Identifikatorlar o'zgarmaydi: slug 'kaliti-market', provider_uid 'platform:stomatolog-kaliti', buyurtma raqamlari (SK-…).
update public.stores
   set name = 'StomaHub Market', owner_name = 'StomaHub',
       bio = 'StomaHub rasmiy katalogi — platforma o‘zi sotadigan mahsulotlar. Buyurtmalarni platforma administratori boshqaradi.'
 where is_platform and slug = 'kaliti-market';
update public.profiles set full_name = 'StomaHub (platforma)' where provider_uid = 'platform:stomatolog-kaliti';
update public.orders set shop_name = 'StomaHub Market' where shop_name = 'Kaliti Market';
