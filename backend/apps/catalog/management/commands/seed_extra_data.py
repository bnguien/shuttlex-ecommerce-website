import random
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Product, ProductVariant, Category, Brand, Size

class Command(BaseCommand):
    help = "Seeding extra products and enriching variants for existing products"

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting extra seeding...")
        
        # 1. Setup Sizes
        racket_sizes = ["3U", "4U", "5U"]
        clothes_sizes = ["S", "M", "L", "XL", "XXL"]
        womens_shoes_sizes = ["36", "37", "38", "39", "40"]
        mens_shoes_sizes = ["38", "39", "40", "41", "42", "43"]
        all_shoes_sizes = list(set(womens_shoes_sizes + mens_shoes_sizes))
        
        for name in racket_sizes:
            Size.objects.get_or_create(name=name, type="racket")
        for name in clothes_sizes:
            Size.objects.get_or_create(name=name, type="clothes")
        for name in all_shoes_sizes:
            Size.objects.get_or_create(name=name, type="shoes")
            
        sizes_map = {
            "racket": list(Size.objects.filter(type="racket")),
            "clothes": list(Size.objects.filter(type="clothes")),
            "womens_shoes": list(Size.objects.filter(type="shoes", name__in=womens_shoes_sizes)),
            "mens_shoes": list(Size.objects.filter(type="shoes", name__in=mens_shoes_sizes)),
        }
        
        # 2. Enrich existing products with variants
        existing_products = Product.objects.all()
        enriched_count = 0
        for p in existing_products:
            if p.variants.exists():
                continue
            
            sizes_to_add = []
            if p.category_id == 1:
                sizes_to_add = sizes_map["racket"]
            elif p.category_id == 2:
                if "nữ" in p.name.lower() or "women" in p.name.lower() or "women" in p.slug.lower() or p.slug in ["victor-p8500-nitrolite-zsw-dx", "yonex-cascade-drive-3", "lining-ayts016-6-womens-badminton-shoes"]:
                    sizes_to_add = sizes_map["womens_shoes"]
                else:
                    sizes_to_add = sizes_map["mens_shoes"]
            elif p.category_id == 3:
                sizes_to_add = sizes_map["clothes"]
                
            if sizes_to_add:
                for size in sizes_to_add:
                    ProductVariant.objects.create(
                        product=p,
                        size=size,
                        color="Default",
                        stock=random.randint(5, 50),
                        price=p.base_price
                    )
                enriched_count += 1
            else:
                ProductVariant.objects.create(
                    product=p,
                    size=None,
                    color="Default",
                    stock=random.randint(10, 100),
                    price=p.base_price
                )
                enriched_count += 1
                
        self.stdout.write(f"Enriched {enriched_count} existing products with variants.")
        
        # 3. Create New Products from User's List
        new_items = [
            {
                "name": "Áo Cầu Lông Li-Ning Nữ P-ATSUB12-1",
                "slug": "lining-p-atsub12-1-womens-badminton-shirt-white",
                "image": "products/li-ning-p-atsub12-1-womens-badminton-shirt-white.jpg",
                "category_id": 3, "brand_id": 2, "price": 450000.00,
                "desc": "Chất liệu vải: 100% Polyester. Công nghệ AT AIR thoáng khí nhanh khô. Form dáng Regular fit."
            },
            {
                "name": "Áo T-shirt Nữ Li-Ning P-AAYV038-3V Đỏ",
                "slug": "lining-p-aayv038-3v-womens-badminton-shirt-red",
                "image": "products/li-ning-p-aayv038-3v-womens-badminton-shirt-red.jpg",
                "category_id": 3, "brand_id": 2, "price": 380000.00,
                "desc": "Áo thể thao nữ Li-Ning, màu sắc nổi bật, co giãn tốt, thấm hút mồ hôi."
            },
            {
                "name": "Bộ Quần Áo Cầu Lông Nữ Li-Ning P-AATV014-3V",
                "slug": "lining-p-aatv014-3v-womens-badminton-clothes-blue",
                "image": "products/li-ning-p-aatv014-3v-womens-badminton-clothes-blue.jpg",
                "category_id": 3, "brand_id": 2, "price": 750000.00,
                "desc": "Bộ quần áo thể thao nữ, chất liệu mềm mại, thấm hút tốt."
            },
            {
                "name": "Giày Cầu Lông Li-Ning Nữ Soundwave II",
                "slug": "lining-ayts016-6-womens-badminton-shoes",
                "image": "products/li-ning-ayts016-6-womens-badminton-shoes.jpg",
                "category_id": 2, "brand_id": 2, "price": 1250000.00,
                "desc": "Giày cầu lông Soundwave II dành cho nữ, bám sân cực tốt, công nghệ đệm êm ái."
            },
            {
                "name": "Áo Thể Thao Li-Ning Nam P-AAYV101-2V",
                "slug": "lining-p-aayv101-2v-men-badmin-t-shirt",
                "image": "products/li-ning-p-aayv101-2v-men-badmin-t-shirt.jpg",
                "category_id": 3, "brand_id": 2, "price": 420000.00,
                "desc": "Áo thể thao nam Li-Ning, thiết kế mạnh mẽ, thoáng khí."
            },
            {
                "name": "Bộ Quần Áo Cầu Lông Li-Ning Nam AATT039-3V",
                "slug": "lining-p-aatt039-3v-men-badminton-clothes",
                "image": "products/li-ning-p-aatt039-3v-men-badminton-clothes.jpg",
                "category_id": 3, "brand_id": 2, "price": 850000.00,
                "desc": "Bộ thể thao nam, chất vải nhẹ, co giãn 4 chiều."
            },
            {
                "name": "Giày Cầu Lông Li-Ning Blade Lite Nam",
                "slug": "lining-aytv023-1-men-badminton-shoes",
                "image": "products/li-ning-aytv023-1-men-badminton-shoes.jpg",
                "category_id": 2, "brand_id": 2, "price": 1550000.00,
                "desc": "Giày chuyên nghiệp Blade Lite, hỗ trợ di chuyển ngang xuất sắc."
            },
            {
                "name": "Váy Cầu Lông Nữ Li-Ning P-ASKV282-1V",
                "slug": "lining-p-askv282-1v-women-badminton-skirt",
                "image": "products/li-ning-p-askv282-1v-women-badminton-skirt.jpg",
                "category_id": 3, "brand_id": 2, "price": 350000.00,
                "desc": "Váy thể thao nữ Li-Ning có quần lót trong an toàn."
            },
            {
                "name": "Chân Váy Nữ Li-Ning ASKW174-1V",
                "slug": "lining-askw174-1v-women-badminton-skirt",
                "image": "products/li-ning-askw174-1v-women-badminton-skirt.jpg",
                "category_id": 3, "brand_id": 2, "price": 320000.00,
                "desc": "Chân váy thể thao kiểu dáng trẻ trung năng động."
            },
            {
                "name": "Khung Vợt Cầu Lông Halbertec 7000 Twilight Purple",
                "slug": "lining-halbertec-7000-twilight-purple",
                "image": "products/li-ning-halbertec-7000-twilight-purple.jpg",
                "category_id": 1, "brand_id": 2, "price": 3950000.00,
                "desc": "Vợt cầu lông cao cấp Halbertec 7000, thiên công mạnh mẽ."
            },
            {
                "name": "Vợt Cầu Lông Li-Ning Halbertec 5000",
                "slug": "lining-halbertec-5000-3U",
                "image": "products/li-ning-halbertec-5000-3U.jpg",
                "category_id": 1, "brand_id": 2, "price": 2850000.00,
                "desc": "Vợt công thủ toàn diện, linh hoạt cho lối đánh phản tạt."
            },
            {
                "name": "Túi Đựng Vợt Li-Ning ABJP078-3",
                "slug": "lining-abjp078-3-bag",
                "image": "products/li-ning-abjp078-3-bag.jpg",
                "category_id": 5, "brand_id": 2, "price": 1200000.00,
                "desc": "Túi vợt 9 ngăn rộng rãi, chống thấm nước."
            },
            {
                "name": "Băng Tay Thể Thao Li-Ning AHWR010-8V",
                "slug": "lining-ahwr010-8v",
                "image": "products/li-ning-ahwr010-8v.jpg",
                "category_id": 4, "brand_id": 2, "price": 95000.00,
                "desc": "Băng cổ tay thấm mồ hôi, kháng khuẩn tốt."
            },
            {
                "name": "Ống Cầu Bamboo",
                "slug": "bamboo-shuttlecock-tube",
                "image": "products/bamboo-shuttlecock-tube.jpg",
                "category_id": 6, "brand_id": 6, "price": 250000.00,
                "desc": "Ống cầu lông Bamboo tiêu chuẩn, bền bỉ."
            },
            {
                "name": "Ống Cầu Hải Yến",
                "slug": "hai-yen-shuttlecock-tube",
                "image": "products/hai-yen-shuttlecock-tube.jpg",
                "category_id": 6, "brand_id": 6, "price": 300000.00,
                "desc": "Ống cầu Hải Yến cao cấp dùng cho thi đấu."
            },
            {
                "name": "Ống Cầu HYFA",
                "slug": "hyfa-shuttlecock-tube",
                "image": "products/hyfa-shuttlecock-tube.jpg",
                "category_id": 6, "brand_id": 6, "price": 290000.00,
                "desc": "Cầu HYFA bay đầm, độ bền cao."
            },
            {
                "name": "Ống Cầu Victor NCS",
                "slug": "victor-ncs-shuttlecock-tube",
                "image": "products/victor-ncs-shuttlecock-tube.jpg",
                "category_id": 6, "brand_id": 3, "price": 360000.00,
                "desc": "Cầu lông Victor NCS Master chuyên dùng giải đấu quốc tế."
            },
            {
                "name": "Túi Vải Victor",
                "slug": "victor-bag",
                "image": "products/victor-bag.jpg",
                "category_id": 5, "brand_id": 3, "price": 50000.00,
                "desc": "Túi rút Victor tiện dụng."
            },
            {
                "name": "Vớ Cầu Lông Yonex SKSL10111MP9 Cannoli Cream",
                "slug": "yonex-sksl10111mp9-socks",
                "image": "products/yonex-sksl10111mp9-socks.jpg",
                "category_id": 4, "brand_id": 1, "price": 85000.00,
                "desc": "Vớ Yonex dày dặn, bảo vệ mắt cá chân."
            },
            {
                "name": "Vớ Cầu Lông Yonex SKSL12108MP9 White",
                "slug": "yonex-sksl12108mp9-socks",
                "image": "products/yonex-sksl12108mp9-socks.jpg",
                "category_id": 4, "brand_id": 1, "price": 85000.00,
                "desc": "Vớ trắng tinh tế, thấm hút mồ hôi cực tốt."
            },
            {
                "name": "Băng Trán Cầu Lông Yonex PHB001ZHB1ZZ Lilac Marble",
                "slug": "yonex-PHB002ZHB1ZZ-bang-tran",
                "image": "products/yonex-PHB002ZHB1ZZ-bang-tran.jpg",
                "category_id": 4, "brand_id": 1, "price": 120000.00,
                "desc": "Băng chặn mồ hôi trán Yonex."
            },
            {
                "name": "Vợt Cầu Lông Victor Thruster Ryuga Muse F",
                "slug": "victor-thruster-ryuga-muse-f",
                "image": "products/victor-thruster-ryuga-muse-f.jpg",
                "category_id": 1, "brand_id": 3, "price": 3850000.00,
                "desc": "Vợt Victor Ryuga Muse tấn công uy lực."
            },
            {
                "name": "Vợt Cầu Lông Victor Auraspeed Fantome F HYQ",
                "slug": "victor-auraspeed-fantome-f-hyq",
                "image": "products/victor-auraspeed-fantome-f-hyq.jpg",
                "category_id": 1, "brand_id": 3, "price": 4100000.00,
                "desc": "Vợt tốc độ Auraspeed Fantome phòng thủ phản tạt nhanh."
            },
            {
                "name": "Quần Cầu Lông Yonex TSM2906 Jet Black",
                "slug": "yonex-tsm2906-badminton-shorts",
                "image": "products/yonex-tsm2906-badminton-shorts.jpg",
                "category_id": 3, "brand_id": 1, "price": 350000.00,
                "desc": "Quần đùi Yonex đen basic, dễ phối đồ."
            },
            {
                "name": "Túi Cầu Lông Victor BR9616 FM Xanh Biển",
                "slug": "victor-br9619-fm-bag",
                "image": "products/victor-br9619-fm-bag.jpg",
                "category_id": 5, "brand_id": 3, "price": 950000.00,
                "desc": "Túi vuông Victor rộng rãi, có ngăn để giày riêng."
            },
            {
                "name": "Áo Cầu Lông Victor 2121 Nữ Trắng Xanh",
                "slug": "victor-2121-women-badminton-t-shirt-white",
                "image": "products/victor-2121-women-badminton-t-shirt-white.jpg",
                "category_id": 3, "brand_id": 3, "price": 280000.00,
                "desc": "Áo Victor nữ phối màu thanh lịch."
            },
            {
                "name": "Váy Cầu Lông Yonex 92006 Đỏ",
                "slug": "yonex-92006-women-badminton-skirt",
                "image": "products/yonex-92006-women-badminton-skirt.jpg",
                "category_id": 3, "brand_id": 1, "price": 320000.00,
                "desc": "Váy Yonex đỏ rực rỡ, kèm quần bảo hộ bên trong."
            }
        ]
        
        new_product_count = 0
        tags_map = {
            1: "vợt, racket, cầu lông, badminton",
            2: "giày, shoes, cầu lông, badminton",
            3: "áo, quần, váy, clothes, shirt, shorts, skirt, cầu lông, badminton",
            4: "phụ kiện, vớ, tất, băng trán, băng tay, accessories, socks, headband, sweatband, cầu lông, badminton",
            5: "ba lô, túi, backpack, bag, cầu lông, badminton",
            6: "cầu, shuttlecock, quả cầu, quả cầu lông, cầu lông, badminton",
        }
        for item in new_items:
            # Determine tags based on category or name keywords
            category_tags = tags_map.get(item["category_id"], "")
            name_lower = item["name"].lower()
            extra_terms = []
            if "áo" in name_lower or "shirt" in name_lower:
                extra_terms.extend(["áo", "shirt", "t-shirt"])
            if "quần" in name_lower or "shorts" in name_lower:
                extra_terms.extend(["quần", "shorts"])
            if "váy" in name_lower or "skirt" in name_lower:
                extra_terms.extend(["váy", "skirt"])
            if "vớ" in name_lower or "tất" in name_lower or "socks" in name_lower:
                extra_terms.extend(["vớ", "tất", "socks"])
            if "băng" in name_lower or "sweatband" in name_lower or "headband" in name_lower:
                extra_terms.extend(["băng chặn mồ hôi", "băng tay", "băng trán", "sweatband", "headband"])
            if "túi" in name_lower or "bag" in name_lower or "ba lô" in name_lower or "backpack" in name_lower:
                extra_terms.extend(["túi", "ba lô", "bag", "backpack"])
            if "cầu" in name_lower or "shuttlecock" in name_lower:
                extra_terms.extend(["cầu", "shuttlecock", "quả cầu"])
            
            final_tags = set([x.strip() for x in category_tags.split(",") if x.strip()])
            final_tags.update(extra_terms)
            tags_str = ", ".join(sorted(final_tags))

            p, created = Product.objects.get_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "image": item["image"],
                    "category_id": item["category_id"],
                    "brand_id": item["brand_id"],
                    "base_price": item["price"],
                    "description": item["desc"],
                    "base_stock": 0,
                    "is_active": True,
                    "tags": tags_str
                }
            )
            
            if created:
                new_product_count += 1
                # Create variants for new product
                sizes_to_add = []
                if p.category_id == 1:
                    sizes_to_add = sizes_map["racket"]
                elif p.category_id == 2:
                    if "nữ" in p.name.lower() or "women" in p.name.lower() or "women" in p.slug.lower() or p.slug in ["victor-p8500-nitrolite-zsw-dx", "yonex-cascade-drive-3", "lining-ayts016-6-womens-badminton-shoes"]:
                        sizes_to_add = sizes_map["womens_shoes"]
                    else:
                        sizes_to_add = sizes_map["mens_shoes"]
                elif p.category_id == 3:
                    sizes_to_add = sizes_map["clothes"]
                    
                if sizes_to_add:
                    for size in sizes_to_add:
                        ProductVariant.objects.create(
                            product=p,
                            size=size,
                            color="Default",
                            stock=random.randint(5, 50),
                            price=p.base_price
                        )
                else:
                    ProductVariant.objects.create(
                        product=p,
                        size=None,
                        color="Default",
                        stock=random.randint(10, 100),
                        price=p.base_price
                    )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {new_product_count} new products and variants!"))
