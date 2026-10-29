import React from "react";
import { useI18n } from "@/lib/i18n";
import { Product } from "@/types/product.types";
import ProductDetails from "./ProductDetails";

const ProductDetailsContent = ({ data }: { data: Product | null }) => {
  const { t } = useI18n();
  const rows: { label: string; value: string }[] = [];

  if (data?.categoryPath) rows.push({ label: t("product.categoryPath"), value: data.categoryPath });
  if (data?.brand) rows.push({ label: t("addProduct.brand"), value: data.brand });
  if (data?.size) rows.push({ label: t("addProduct.size"), value: data.size });
  if (data?.condition) rows.push({ label: t("addProduct.condition"), value: t(`cond.${data.condition}`) });
  if (data?.colors?.length) rows.push({ label: t("addProduct.colors"), value: data.colors.map((c) => t(`color.${c}`)).join(", ") });
  if (data?.materials?.length) rows.push({ label: t("addProduct.material"), value: data.materials.map((m) => t(`material.${m}`)).join(", ") });
  if (data?.packageSize) rows.push({ label: t("addProduct.packageSize"), value: t(`pkg.${data.packageSize}`) });

  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-black mb-5 sm:mb-6">
        {t("product.specifications")}
      </h3>
      <ProductDetails items={rows} />
    </section>
  );
};

export default ProductDetailsContent;
