import { PageHeader } from "@/components/ui";
import { CsvImport } from "@/components/CsvImport";

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import CSV" subtitle="Alimentez la base à partir de fichiers CSV : compagnies, villes et trajets. Chaque import est validé avant écriture." />
      <CsvImport />
    </>
  );
}
