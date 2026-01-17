import React, { useMemo, useState } from "react";
import styles from "./MainPage.module.scss";
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
import {
 filterTypeOptions,
 getMonthOptions,
 getYearOptions,
} from "./MainFilterData";

export const MainPage: React.FC = () => {
 const { data: transfers = [], isLoading, isError } = useGetTransfersQuery();
 const [filteredTransfers, setFilteredTransfers] = useState<Transaction[]>([]);
 const [hasFiltered, setHasFiltered] = useState(false);

 // Filtros principales
 const [filterType, setFilterType] = useState("mes-anio");
 const [month, setMonth] = useState("");
 const [year, setYear] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");

 // Filtros secundarios
 const [serieNumeroSearch, setSerieNumeroSearch] = useState("");

 const navigate = useNavigate();

 const displayedTransfers = hasFiltered ? filteredTransfers : transfers;

 // Opciones dinámicas de año y mes
 const yearOptions = getYearOptions();
 const monthOptions = getMonthOptions(year);

 // Resetear mes cuando cambia el año y el mes seleccionado no está disponible
 const handleYearChange = (newYear: string) => {
  setYear(newYear);
  const availableMonths = getMonthOptions(newYear);
  if (month && !availableMonths.some((m) => m.value === month)) {
   setMonth("");
  }
 };

 const applyAllFilters = () => {
  let filtered = [...transfers];

  // Filtros de fecha
  if (filterType === "mes-anio") {
   if (month && year) {
    filtered = filtered.filter((t) => {
     const parts = t.fechaEmision.split("-");
     return parts[0] === year && parts[1] === month;
    });
   }
  } else if (filterType === "rango-fechas") {
   if (startDate && endDate) {
    filtered = filtered.filter(
     (t) => t.fechaEmision >= startDate && t.fechaEmision <= endDate,
    );
   }
  }

  // Filtro por serie y número
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

 const handleTopFilter = () => {
  applyAllFilters();
 };

 const handleSecondaryFilter = () => {
  applyAllFilters();
 };

 const handleRegisterTransfer = () => {
  navigate(
   `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.TRANSFERS}${COMMON_ROUTES.REGISTER}`,
  );
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
        onClick={() => handleRegisterTransfer()}
       >
        Ver detalle
       </Button>,
      ],
     }) as TableRow,
   ),
  [displayedTransfers],
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
   <div className={styles.homePurchasePage}>
    <section className={styles.filtersTop}>
     <div className={styles.filter}>
      <Text size="xs" color="neutral-primary">
       Tipo de filtro
      </Text>
      <ComboBox
       options={filterTypeOptions}
       size="xs"
       value={filterType}
       onChange={(v) => setFilterType(v as string)}
       placeholder="Seleccionar"
      />
     </div>

     {filterType === "mes-anio" && (
      <>
       <div className={styles.filter}>
        <Text size="xs" color="neutral-primary">
         Año
        </Text>
        <ComboBox
         options={yearOptions}
         size="xs"
         value={year}
         onChange={(v) => handleYearChange(v as string)}
         placeholder="Seleccionar año"
        />
       </div>
       <div className={styles.filter}>
        <Text size="xs" color="neutral-primary">
         Mes
        </Text>
        <ComboBox
         options={monthOptions}
         size="xs"
         value={month}
         onChange={(v) => setMonth(v as string)}
         placeholder="Seleccionar mes"
        />
       </div>
      </>
     )}

     {filterType === "rango-fechas" && (
      <>
       <div className={styles.filter}>
        <Text size="xs" color="neutral-primary">
         Fecha inicio
        </Text>
        <Input
         type="date"
         size="xs"
         value={startDate}
         onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setStartDate(e.target.value)
         }
        />
       </div>
       <div className={styles.filter}>
        <Text size="xs" color="neutral-primary">
         Fecha fin
        </Text>
        <Input
         type="date"
         size="xs"
         value={endDate}
         onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEndDate(e.target.value)
         }
        />
       </div>
      </>
     )}

     <Button size="small" onClick={handleTopFilter}>
      Filtrar
     </Button>
    </section>

    <Divider />

    <section className={styles.actionsRow}>
     <Button size="medium" onClick={handleRegisterTransfer}>
      + Nueva transferencia
     </Button>
    </section>

    <Divider />

    <section className={styles.filtersSecondary}>
     <div className={styles.filter}>
      <Text size="xs" color="neutral-primary">
       Serie y número
      </Text>
      <Input
       type="text"
       size="xs"
       value={serieNumeroSearch}
       onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setSerieNumeroSearch(e.target.value)
       }
       placeholder="Buscar por serie y número"
      />
     </div>

     <Button size="small" onClick={handleSecondaryFilter}>
      Filtrar búsqueda
     </Button>
    </section>

    <Divider />

    <Table
     headers={headers}
     rows={rows}
     gridTemplate={gridTemplate}
     isLoading={isLoading}
     isError={isError}
    />
   </div>
  </PageLayout>
 );
};
