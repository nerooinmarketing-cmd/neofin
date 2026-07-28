import { Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "./empty-state";

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  stage: string;
}

/** Placeholder for modules scheduled in a later build stage (see Aşama planı). */
export function ModulePlaceholder({
  title,
  description,
  stage,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Construction className="size-6" />}
        title="Bu modül henüz geliştirilmedi"
        description={`${title} modülü ${stage} kapsamında eklenecek.`}
      />
    </>
  );
}
