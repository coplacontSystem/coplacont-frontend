import React, { useMemo, useState } from "react";
import {
 PageLayout,
 Button,
 Text,
 ComboBox,
 Input,
 Divider,
} from "@/components";
import { Table, type TableRow } from "@/components/organisms/Table";
import { useGetTransfersQuery } from "../../api/transactionsApi";
import type { Transaction } from "../../services/types";
import { useNavigate } from "react-router-dom";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";

export const MainPage: React.FC = () => {
 const { data: transfers = [], isLoading, isError } = useGetTransfersQuery();
 const [filteredTransfers, setFilteredTransfers] = useState<Transaction[]>([]);
 const [hasFiltered, setHasFiltered] = useState(false);

 const [serieNumeroSearch, setSerieNumeroSearch] = useState("");
 const [dateFilterType, setDateFilterType] = useState<
  "mes-anio" | "rango-fechas"
 >("mes-anio");
 const [month, setMonth] = useState("");
 const [year, setYear] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");

 const navigate = useNavigate();

 const displayedTransfers = hasFiltered ? filteredTransfers : transfers;

 const applyFilters = () => {
  let filtered = [...transfers];

  if (dateFilterType === "mes-anio") {
   if (month && year) {
    filtered = filtered.filter((t) => {
     const parts = t.fechaEmision.split("-");
     return parts[0] === year && parts[1] === month;
    });
   }
  } else if (dateFilterType === "rango-fechas") {
   if (startDate && endDate) {
    filtered = filtered.filter(
     (t) => t.fechaEmision >= startDate && t.fechaEmision <= endDate,
    );
   }
  }

  if (serieNumeroSearch) {
   filtered = filtered.filter((t) => {
    const serieNumero = `${t.serie}-${t.numero}`.toLowerCase();
    return (
     serieNumero.includes(serieNumeroSearch.toLowerCase()) ||
     (t.correlativo || "")
      .toLowerCase()
      .includes(serieNumeroSearch.toLowerCase())
    );
   });
  }

  setFilteredTransfers(filtered);
  setHasFiltered(true);
 };

 const rows = useMemo(
  () =>
   displayedTransfers.map(
    (t, idx) =>
     ({
      id: String(idx + 1),
      cells: [
       t.correlativo || "N/A",
       typeof t.tipoOperacion === "string"
        ? (t.tipoOperacion as string)
        : t.tipoOperacion?.descripcion || "N/A",
       `${t.serie || ""}-${t.numero || ""}`,
       t.fechaEmision || "N/A",
       t.totales?.totalGeneral?.toString() || "0",
       <Button
        key={`view-${t.idComprobante}`}
        size="tableItemSize"
        variant="tableItemStyle"
        onClick={() =>
         navigate(
          `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.TRANSFERS}${COMMON_ROUTES.REGISTER}`,
         )
        }
       >
        Registrar nueva
       </Button>,
      ],
     }) as TableRow,
   ),
  [displayedTransfers, navigate],
 );

 const headers = [
  "Correlativo",
  "Tipo Operación",
  "Serie y Número",
  "Fecha Emisión",
  "Total General",
  "Acciones",
 ];
 const gridTemplate = "0.8fr 1.4fr 1fr 1fr 0.8fr 0.8fr";

 return (
  <PageLayout
   title="Transferencias"
   subtitle="Listado de transferencias internas entre almacenes"
  >
   <section
    style={{
     display: "grid",
     gridTemplateColumns: "repeat(4, 1fr)",
     gap: "16px",
     alignItems: "end",
    }}
   >
    <div>
     <Text size="xs" color="neutral-primary">
      Tipo de filtro
     </Text>
     <ComboBox
      options={[
       { value: "mes-anio", label: "Mes/Año" },
       { value: "rango-fechas", label: "Rango de fechas" },
      ]}
      size="xs"
      variant="createSale"
      value={dateFilterType}
      onChange={(v) => setDateFilterType(v as "mes-anio" | "rango-fechas")}
      placeholder="Seleccionar"
     />
    </div>
    {dateFilterType === "mes-anio" ? (
     <>
      <div>
       <Text size="xs" color="neutral-primary">
        Año
       </Text>
       <Input
        type="text"
        size="xs"
        variant="createSale"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        placeholder="YYYY"
       />
      </div>
      <div>
       <Text size="xs" color="neutral-primary">
        Mes
       </Text>
       <Input
        type="text"
        size="xs"
        variant="createSale"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        placeholder="MM"
       />
      </div>
     </>
    ) : (
     <>
      <div>
       <Text size="xs" color="neutral-primary">
        Desde
       </Text>
       <Input
        type="date"
        size="xs"
        variant="createSale"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
       />
      </div>
      <div>
       <Text size="xs" color="neutral-primary">
        Hasta
       </Text>
       <Input
        type="date"
        size="xs"
        variant="createSale"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
       />
      </div>
     </>
    )}
    <Button size="small" onClick={applyFilters}>
     Filtrar
    </Button>
   </section>

   <Divider />

   <section
    style={{
     display: "grid",
     gridTemplateColumns: "repeat(3, 1fr)",
     gap: "16px",
     alignItems: "end",
    }}
   >
    <div>
     <Text size="xs" color="neutral-primary">
      Serie y número
     </Text>
     <Input
      type="text"
      size="xs"
      variant="createSale"
      value={serieNumeroSearch}
      onChange={(e) => setSerieNumeroSearch(e.target.value)}
      placeholder="Buscar por serie y número"
     />
    </div>
    <Button size="small" onClick={applyFilters}>
     Filtrar búsqueda
    </Button>
    <Button
     size="medium"
     onClick={() =>
      navigate(
       `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.TRANSFERS}${COMMON_ROUTES.REGISTER}`,
      )
     }
    >
     + Nueva transferencia
    </Button>
   </section>

   <Divider />
   <Table
    headers={headers}
    rows={rows}
    gridTemplate={gridTemplate}
    isLoading={isLoading}
    loadingText="Procesando..."
    isError={isError}
    errorTitle="Error"
    errorSubtitle="No se pudieron cargar las compras. Por favor, intente nuevamente."
   />
  </PageLayout>
 );
};
