import React, { useMemo, useState } from "react";
import styles from "./MainPage.module.scss";
import type { Transaction } from "../../services/types";
import { useGetSalesQuery } from "../../api/transactionsApi";

import {
 Button,
 PageLayout,
 Text,
 Modal,
 ComboBox,
 Input,
 Divider,
} from "@/components";
import { Table, type TableRow } from "@/components/organisms/Table";
import {
 documentTypeOptions,
 filterTypeOptions,
 getMonthOptions,
 getYearOptions,
} from "./MainFilterData";
import { useNavigate } from "react-router-dom";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";

export const MainPage: React.FC = () => {
 const { data: sales = [], isLoading, isError } = useGetSalesQuery();
 const [filteredSales, setFilteredSales] = useState<Transaction[]>([]);
 const [hasFiltered, setHasFiltered] = useState(false);

 const navigate = useNavigate();

 const displayedSales = hasFiltered ? filteredSales : sales;

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedSale, setSelectedSale] = useState<Transaction | null>(null);

 const [filterType, setFilterType] = useState("mes-anio");
 const [month, setMonth] = useState("");
 const [year, setYear] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");

 const [entity, setEntity] = useState("");
 const [client, setClient] = useState("");
 const [documentType, setDocumentType] = useState("");

 const [isUploadOpen, setUploadOpen] = useState(false);

 const detailGridTemplate = "0.8fr 2fr 1.2fr 1.2fr 1fr 1fr 1.2fr";

 const handleRegisterSale = () => {
  navigate(
   `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}${COMMON_ROUTES.REGISTER}`,
  );
 };

 const applyAllFilters = () => {
  let filtered = [...sales];

  if (filterType === "mes-anio") {
   if (month && year) {
    filtered = filtered.filter((sale) => {
     const dateParts = sale.fechaEmision.split("-");
     const saleYear = dateParts[0];
     const saleMonth = dateParts[1];
     return saleMonth === month && saleYear === year;
    });
   }
  } else if (filterType === "rango-fechas") {
   if (startDate && endDate) {
    filtered = filtered.filter((sale) => {
     const emissionDate = sale.fechaEmision;
     return emissionDate >= startDate && emissionDate <= endDate;
    });
   }
  }

  if (entity) {
   filtered = filtered.filter((sale) => {
    const serieNumero = `${sale.serie}-${sale.numero}`;
    return (
     serieNumero.toLowerCase().includes(entity.toLowerCase()) ||
     sale.correlativo?.toLowerCase().includes(entity.toLowerCase())
    );
   });
  }

  if (client) {
   filtered = filtered.filter((sale) => {
    const searchTerm = client.toLowerCase();
    const entidad = sale.entidad;
    if (!entidad) return false;
    const razonSocial = entidad.razonSocial?.toLowerCase() || "";
    const nombreCompleto = entidad.nombreCompleto?.toLowerCase() || "";
    const numeroDocumento = entidad.numeroDocumento?.toLowerCase() || "";
    return (
     razonSocial.includes(searchTerm) ||
     nombreCompleto.includes(searchTerm) ||
     numeroDocumento.includes(searchTerm)
    );
   });
  }

  if (documentType) {
   filtered = filtered.filter((sale) => {
    const docTypeMap: { [key: string]: string } = {
     factura: "FACTURA",
     boleta: "BOLETA",
     "nota-credito": "NOTA_CREDITO",
     "nota-debito": "NOTA_DEBITO",
    };
    const tipoComprobanteStr =
     typeof sale.tipoComprobante === "string"
      ? sale.tipoComprobante
      : sale.tipoComprobante?.descripcion || "";
    return (
     tipoComprobanteStr.toUpperCase() ===
     docTypeMap[documentType]?.toUpperCase()
    );
   });
  }

  setFilteredSales(filtered);
  setHasFiltered(true);
 };

 const handleTopFilter = () => {
  applyAllFilters();
 };

 const handleSecondaryFilter = () => {
  applyAllFilters();
 };

 const handleOpenDetailModal = (sale: Transaction) => {
  setSelectedSale(sale);
  setIsModalOpen(true);
 };

 const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedSale(null);
 };

 const rows = useMemo(
  () =>
   displayedSales.map(
    (sale, idx) =>
     ({
      id: idx + 1,
      cells: [
       sale.correlativo || "N/A",
       typeof sale.tipoComprobante === "string"
        ? sale.tipoComprobante
        : sale.tipoComprobante?.descripcion || "N/A",
       sale.entidad?.tipo === "JURIDICA"
        ? sale.entidad?.razonSocial || "N/A"
        : sale.entidad?.nombreCompleto || "N/A",
       `${sale.serie || ""}-${sale.numero || ""}`,
       sale.fechaEmision || "N/A",
       sale.fechaVencimiento !== null && sale.fechaVencimiento !== undefined
        ? sale.fechaVencimiento
        : "No especificado",
       sale.totales?.totalGeneral?.toString() || "0",
       <Button
        key={`btn-${sale.idComprobante}`}
        size="tableItemSize"
        variant="tableItemStyle"
        onClick={() => handleOpenDetailModal(sale)}
       >
        Ver Detalle
       </Button>,
      ],
     }) as TableRow,
   ),
  [displayedSales],
 );

 const headers = [
  "Correlativo",
  "Tipo Comprobante",
  "Cliente",
  "Serie y Número",
  "Fecha Emisión",
  "Fecha Vencimiento",
  "Total General",
  "Acciones",
 ];

 const gridTemplate = "0.6fr 0.8fr 1fr 0.8fr 1fr 1fr 1fr 1fr";

 return (
  <PageLayout
   title="Ventas"
   subtitle={`Muestra la lista de ventas registradas.`}
  >
   <section className={styles.filtersTop}>
    <div className={styles.filter}>
     <Text size="xs" color="neutral-primary">
      Tipo de filtro
     </Text>
     <ComboBox
      options={filterTypeOptions}
      size="xs"
      variant="createSale"
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
        options={getYearOptions()}
        size="xs"
        variant="createSale"
        value={year}
        onChange={(v) => setYear(v as string)}
        placeholder="Seleccionar año"
       />
      </div>

      <div className={styles.filter}>
       <Text size="xs" color="neutral-primary">
        Mes
       </Text>
       <ComboBox
        options={getMonthOptions(year)}
        size="xs"
        variant="createSale"
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
        Desde
       </Text>
       <Input
        type="date"
        size="xs"
        variant="createSale"
        value={startDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
         setStartDate(e.target.value)
        }
        placeholder="Seleccionar"
       />
      </div>
      <div className={styles.filter}>
       <Text size="xs" color="neutral-primary">
        Hasta
       </Text>
       <Input
        type="date"
        size="xs"
        variant="createSale"
        value={endDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
         setEndDate(e.target.value)
        }
        placeholder="Seleccionar"
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
    <Button size="medium" onClick={handleRegisterSale}>
     + Nueva venta
    </Button>
    <Button disabled={true} size="medium" onClick={() => setUploadOpen(true)}>
     ⇪ Subir ventas
    </Button>
   </section>

   <Divider />

   <section className={styles.filtersSecondary}>
    <div className={styles.filter}>
     <Text size="xs" color="neutral-primary">
      Cliente
     </Text>
     <Input
      type="text"
      size="xs"
      variant="createSale"
      value={client}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
       setClient(e.target.value)
      }
      placeholder="Buscar por cliente"
     />
    </div>
    <div className={styles.filter}>
     <Text size="xs" color="neutral-primary">
      Serie y número
     </Text>
     <Input
      type="text"
      size="xs"
      variant="createSale"
      value={entity}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
       setEntity(e.target.value)
      }
      placeholder="Buscar por serie y número"
     />
    </div>
    <div className={styles.filter}>
     <Text size="xs" color="neutral-primary">
      Tipo de comprobante
     </Text>
     <ComboBox
      options={documentTypeOptions}
      size="xs"
      variant="createSale"
      value={documentType}
      onChange={(v) => setDocumentType(v as string)}
      placeholder="Seleccionar"
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
    loadingText="Procesando..."
    isError={isError}
    errorTitle="Error"
    errorSubtitle="No se pudieron cargar las compras. Por favor, intente nuevamente."
   />

   <Modal
    isOpen={isModalOpen}
    onClose={handleCloseModal}
    title={`Detalle de Venta - ${selectedSale?.numero || ""}`}
    description={`${selectedSale?.persona?.razonSocial || ""} - ${
     selectedSale?.fechaEmision || ""
    }`}
   >
    {selectedSale && (
     <div>
      <div style={{ marginBottom: "24px" }}>
       <Text as="h3" size="md" weight={600}>
        Información General
       </Text>
       <div
        style={{
         display: "grid",
         gridTemplateColumns: "repeat(2, 1fr)",
         gap: "12px",
         marginTop: "16px",
        }}
       >
        <div>
         <Text size="sm" weight={500}>
          Número de Documento:
         </Text>
         <Text size="sm">{selectedSale.persona.razonSocial}</Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Razón Social:
         </Text>
         <Text size="sm">
          {selectedSale.persona.razonSocial || selectedSale.persona.direccion}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Tipo de Comprobante:
         </Text>
         <Text size="sm">
          {typeof selectedSale.tipoComprobante === "string"
           ? selectedSale.tipoComprobante
           : selectedSale.tipoComprobante?.descripcion || "N/A"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Serie - Número:
         </Text>
         <Text size="sm">
          {selectedSale.serie} - {selectedSale.numero}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Fecha de Emisión:
         </Text>
         <Text size="sm">{selectedSale.fechaEmision}</Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Tipo de Cambio:
         </Text>
         <Text size="sm">{selectedSale.tipoCambio}</Text>
        </div>
       </div>
      </div>

      <div>
       <Text as="h3" size="md" weight={600}>
        Detalle de Items
       </Text>
       <div style={{ marginTop: "16px" }}>
        <Table
         headers={[
          "Cantidad",
          "Descripción",
          "Precio Unitario",
          "Subtotal",
          "IGV",
          "ISC",
          "Total",
         ]}
         rows={selectedSale.detalles.map(
          (detalle, index) =>
           ({
            id: index.toString(),
            cells: [
             detalle.cantidad,
             detalle.descripcion,
             `S/ ${detalle.precioUnitario}`,
             `S/ ${detalle.subtotal}`,
             `S/ ${detalle.igv}`,
             `S/ ${detalle.isc}`,
             `S/ ${detalle.total}`,
            ],
           }) as TableRow,
         )}
         gridTemplate={detailGridTemplate}
        />
       </div>
      </div>

      <div
       style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
       }}
      >
       <Text as="h3" size="md" weight={600}>
        Totales
       </Text>
       <div
        style={{
         display: "grid",
         gridTemplateColumns: "repeat(3, 1fr)",
         gap: "12px",
         marginTop: "12px",
        }}
       >
        <div>
         <Text size="sm" weight={500}>
          Total Gravada:
         </Text>
         <Text size="sm">
          S/ {selectedSale.totales?.totalGravada ?? "0.00"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          IGV:
         </Text>
         <Text size="sm">S/ {selectedSale.totales?.totalIgv ?? "0.00"}</Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Total General:
         </Text>
         <Text size="sm" weight={600}>
          S/ {selectedSale.totales?.totalGeneral ?? "0.00"}
         </Text>
        </div>
       </div>
      </div>
     </div>
    )}
   </Modal>

   <Modal
    isOpen={isUploadOpen}
    onClose={() => setUploadOpen(false)}
    title="Subir ventas"
   >
    <Text size="sm" color="neutral-primary">
     Funcionalidad de carga masiva en desarrollo.
    </Text>
   </Modal>
  </PageLayout>
 );
};
