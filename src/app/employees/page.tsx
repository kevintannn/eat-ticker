import { Suspense } from "react";

import { getEmployees } from "@/server/queries";
import { PageHeader } from "@/components/page-header";
import { EmployeesClient } from "./employees-client";

export const dynamic = "force-dynamic";

async function EmployeesTable() {
  const employees = await getEmployees();
  return <EmployeesClient employees={employees} />;
}

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your team roster and seating priority."
      />
      <Suspense fallback={null}>
        <EmployeesTable />
      </Suspense>
    </>
  );
}
