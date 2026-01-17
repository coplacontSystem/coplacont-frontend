import React, { useMemo, useState } from "react";
import styles from "./HomePurchasePage.module.scss";

import type { Transaction } from "../../services/types";
import { useGetPurchasesQuery } from "../../api/transactionsApi";

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
} from "./HomePurchaseFilterData";
import { useNavigate } from "react-router-dom";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";
import { usePurchasesTemplateDownload } from "../../hooks/usePurchasesTemplateDownload";

export const MainPage: React.FC = () => {
 const { data: purchases = [], isLoading, isError } = useGetPurchasesQuery();
 const [filteredPurchases, setFilteredPurchases] = useState<Transaction[]>([]);
 const [hasFiltered, setHasFiltered] = useState(false);

 const navigate = useNavigate();
 const { downloadPurchasesTemplate } = usePurchasesTemplateDownload();

 const displayedPurchases = hasFiltered ? filteredPurchases : purchases;

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedPurchase, setSelectedPurchase] = useState<Transaction | null>(
  null,
 );

 const [filterType, setFilterType] = useState("mes-anio");
 const [month, setMonth] = useState("");
 const [year, setYear] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");

 const [entity, setEntity] = useState("");
 const [provider, setProvider] = useState("");
 const [documentType, setDocumentType] = useState("");

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

 const [isUploadOpen, setUploadOpen] = useState(false);

 const detailGridTemplate = "0.8fr 2fr 1.2fr 1.2fr 1fr 1fr 1.2fr";

 const handleRegisterPurchase = () => {
  navigate(
   `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}${COMMON_ROUTES.REGISTER}`,
  );
 };

 const handleBulkRegister = () => {
  navigate(
   `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}${COMMON_ROUTES.BULK_REGISTER}`,
  );
 };

 const applyAllFilters = () => {
  let filtered = [...purchases];

  if (filterType === "mes-anio") {
   if (month && year) {
    filtered = filtered.filter((purchase) => {
     const dateParts = purchase.fechaEmision.split("-");
     const purchaseYear = dateParts[0];
     const purchaseMonth = dateParts[1];
     return purchaseMonth === month && purchaseYear === year;
    });
   }
  } else if (filterType === "rango-fechas") {
   if (startDate && endDate) {
    filtered = filtered.filter((purchase) => {
     const emissionDate = purchase.fechaEmision;
     return emissionDate >= startDate && emissionDate <= endDate;
    });
   }
  }

  if (entity) {
   filtered = filtered.filter((purchase) => {
    const serieNumero = `${purchase.serie}-${purchase.numero}`;
    return (
     serieNumero.toLowerCase().includes(entity.toLowerCase()) ||
     purchase.correlativo?.toLowerCase().includes(entity.toLowerCase())
    );
   });
  }

  if (provider) {
   filtered = filtered.filter((purchase) => {
    const searchTerm = provider.toLowerCase();
    const entidad = purchase.entidad;
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
   filtered = filtered.filter((purchase) => {
    const docTypeMap: { [key: string]: string } = {
     factura: "FACTURA",
     boleta: "BOLETA",
     "nota-credito": "NOTA DE CREDITO",
     "nota-debito": "NOTA DE DEBITO",
    };
    const expectedType = docTypeMap[documentType];
    const actualType =
     typeof purchase.tipoComprobante === "string"
      ? purchase.tipoComprobante.toUpperCase()
      : purchase.tipoComprobante?.descripcion?.toUpperCase();
    return actualType === expectedType;
   });
  }

  setFilteredPurchases(filtered);
  setHasFiltered(true);
 };

 const handleTopFilter = () => {
  applyAllFilters();
 };

 const handleSecondaryFilter = () => {
  applyAllFilters();
 };

 const handleOpenDetailModal = (purchase: Transaction) => {
  setSelectedPurchase(purchase);
  setIsModalOpen(true);
 };

 const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedPurchase(null);
 };

 const rows = useMemo(
  () =>
   displayedPurchases.map(
    (purchase, idx) =>
     ({
      id: idx + 1,
      cells: [
       purchase.correlativo || "N/A",
       typeof purchase.tipoComprobante === "string"
        ? purchase.tipoComprobante
        : purchase.tipoComprobante?.descripcion || "N/A",
       purchase.entidad?.tipo === "JURIDICA"
        ? purchase.entidad?.razonSocial || "N/A"
        : purchase.entidad?.nombreCompleto || "N/A",
       `${purchase.serie || ""}-${purchase.numero || ""}`,
       purchase.fechaEmision || "N/A",
       purchase.fechaVencimiento !== null &&
       purchase.fechaVencimiento !== undefined
        ? purchase.fechaVencimiento
        : "No especificado",
       purchase.totales?.totalGeneral?.toString() || "0",
       <Button
        key={`btn-${purchase.idComprobante}`}
        size="tableItemSize"
        variant="tableItemStyle"
        onClick={() => handleOpenDetailModal(purchase)}
       >
        Ver Detalle
       </Button>,
      ],
     }) as TableRow,
   ),
  [displayedPurchases],
 );

 const headers = [
  "Correlativo",
  "Tipo Comprobante",
  "Proveedor",
  "Serie y Número",
  "Fecha Emisión",
  "Fecha Vencimiento",
  "Total General",
  "Acciones",
 ];

 const gridTemplate = "0.6fr 0.8fr 1fr 0.8fr 1fr 1fr 1fr 1fr";

 return (
  <PageLayout
   title="Compras"
   subtitle={`Muestra la lista de compras registradas.`}
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
        options={yearOptions}
        size="xs"
        variant="createSale"
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
    <Button size="medium" onClick={handleRegisterPurchase}>
     + Nueva compra
    </Button>
    <Button disabled={true} size="medium" onClick={() => setUploadOpen(true)}>
     ⇪ Subir compras
    </Button>
   </section>

   <Divider />

   <section className={styles.filtersSecondary}>
    <div className={styles.filter}>
     <Text size="xs" color="neutral-primary">
      Proveedor
     </Text>
     <Input
      type="text"
      size="xs"
      variant="createSale"
      value={provider}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
       setProvider(e.target.value)
      }
      placeholder="Buscar por proveedor"
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
    title={`Detalle de Compra - ${selectedPurchase?.numero || ""}`}
    description={`${
     selectedPurchase?.entidad?.razonSocial ||
     selectedPurchase?.entidad?.nombreCompleto ||
     ""
    } - ${selectedPurchase?.fechaEmision || ""}`}
   >
    {selectedPurchase && (
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
         <Text size="sm">
          {selectedPurchase.entidad?.numeroDocumento || "N/A"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Razón Social:
         </Text>
         <Text size="sm">
          {selectedPurchase.entidad?.razonSocial ||
           selectedPurchase.entidad?.nombreCompleto ||
           "N/A"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Tipo de Comprobante:
         </Text>
         <Text size="sm">
          {typeof selectedPurchase.tipoComprobante === "string"
           ? selectedPurchase.tipoComprobante
           : selectedPurchase.tipoComprobante?.descripcion || "N/A"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Serie - Número:
         </Text>
         <Text size="sm">
          {selectedPurchase.serie || ""} - {selectedPurchase.numero || ""}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Fecha de Emisión:
         </Text>
         <Text size="sm">{selectedPurchase.fechaEmision || "N/A"}</Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Tipo de Cambio:
         </Text>
         <Text size="sm">{selectedPurchase.tipoCambio || "N/A"}</Text>
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
         rows={
          selectedPurchase.detalles?.map(
           (detalle, index) =>
            ({
             id: index.toString(),
             cells: [
              detalle.cantidad || "0",
              detalle.descripcion || "N/A",
              `S/ ${detalle.precioUnitario || "0"}`,
              `S/ ${detalle.subtotal || "0"}`,
              `S/ ${detalle.igv || "0"}`,
              `S/ ${detalle.isc || "0"}`,
              `S/ ${detalle.total || "0"}`,
             ],
            }) as TableRow,
          ) || []
         }
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
          S/ {selectedPurchase.totales?.totalGravada || "0"}
         </Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          IGV:
         </Text>
         <Text size="sm">S/ {selectedPurchase.totales?.totalIgv || "0"}</Text>
        </div>
        <div>
         <Text size="sm" weight={500}>
          Total General:
         </Text>
         <Text size="sm" weight={600}>
          S/ {selectedPurchase.totales?.totalGeneral || "0"}
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
    title="Subir compras"
    description="Sube un Excel y genera los registros de forma masiva."
   >
    <div>
     <div style={{ marginBottom: "16px" }}>
      <Button variant="secondary" onClick={downloadPurchasesTemplate}>
       ⬇️ Descargar plantilla de Excel
      </Button>
     </div>

     <div style={{ marginBottom: "16px" }}>
      <Text as="h3" size="md" weight={600}>
       Información a tener en cuenta
      </Text>
      <ul style={{ marginTop: "8px" }}>
       <li>Se proporciona un Excel de ejemplo para facilitar el registro.</li>
       <li>La cabecera (fila 1) no debe borrarse.</li>
       <li>Los registros deben ingresarse desde la fila 2.</li>
       <li>Las Notas de Crédito y Débito no se cargan automáticamente.</li>
       <li>Las fechas deben tener el formato DÍA/MES/AÑO.</li>
       <li>El archivo Excel debe tener un máximo de 500 registros.</li>
      </ul>
     </div>

     <div>
      <Text as="h3" size="md" weight={600}>
       Seleccionar archivo
      </Text>
      <div
       style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        marginTop: "8px",
       }}
      >
       <input type="file" accept=".csv,.xlsx" />
       <Button onClick={handleBulkRegister}>Subir Excel</Button>
      </div>
     </div>
    </div>
   </Modal>
  </PageLayout>
 );
};
