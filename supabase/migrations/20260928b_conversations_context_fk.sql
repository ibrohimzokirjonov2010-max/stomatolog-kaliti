-- order_id / product_id on conversations are context references only. ON DELETE SET NULL collided with the
-- unique (store, buyer, order, product) index (two contexts collapsing into the same NULL pair), which would
-- make deleting a product/order fail. Keep the ids as plain references; the list RPCs use left joins.
alter table public.conversations drop constraint if exists conversations_order_id_fkey;
alter table public.conversations drop constraint if exists conversations_product_id_fkey;
