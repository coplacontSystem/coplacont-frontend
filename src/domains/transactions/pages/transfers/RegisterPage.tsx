import {
 PageLayout,
 Button,
 Text,
 Input,
 ComboBox,
 Divider,
 Loader,
} from "@/components";
import type { IApiError } from "@/shared";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { useGetWarehousesQuery } from "@/domains/maintainers/api/warehouseApi/api";
import {
 useGetInventoryByWarehouseQuery,
 useGetCommonProductsQuery,
} from "@/domains/inventory/api/inventoryApi";
import {
 useLazyGetExchangeRateQuery,
 useCreateTransferMutation,
} from "../../api/transactionsApi";

import { Table, type TableRow } from "@/components/organisms/Table";

type MonedaType = "PEN" | "USD";

interface TransferDetailItem {
 id: string;
 idProducto: number;
 descripcion: string;
 cantidad: number;
 stockOrigen?: number;
}

export const RegisterPage: React.FC = () => {
 const navigate = useNavigate();

 const handleGoBack = () => {
  navigate(-1);
 };

 const [fechaEmision, setFechaEmision] = useState("");
 const [moneda, setMoneda] = useState<MonedaType>("PEN");
 const [tipoCambio, setTipoCambio] = useState<string>("1.00");
 const [serie, setSerie] = useState("");
 const [numero, setNumero] = useState("");

 const { data: almacenes = [] } = useGetWarehousesQuery();
 const [almacenOrigen, setAlmacenOrigen] = useState<string>("");
 const [almacenDestino, setAlmacenDestino] = useState<string>("");

 const { data: productosComunes = [] } = useGetCommonProductsQuery(
  {
   idAlmacen1: Number(almacenOrigen),
   idAlmacen2: Number(almacenDestino),
  },
  {
   skip: !almacenOrigen || !almacenDestino,
  },
 );

 const { data: inventarioOrigen = [] } = useGetInventoryByWarehouseQuery(
  Number(almacenOrigen),
  {
   skip: !almacenOrigen,
  },
 );

 const [detalle, setDetalle] = useState<TransferDetailItem[]>([]);
 const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
 const [cantidadIngresada, setCantidadIngresada] = useState<string>("");
 const [descripcionIngresada, setDescripcionIngresada] = useState<string>("");

 const [getExchangeRate] = useLazyGetExchangeRateQuery();
 const [createTransfer, { isLoading: isCreatingTransfer }] =
  useCreateTransferMutation();

 const [apiError, setApiError] = useState<IApiError | null>(null);

 /**
  * Actualiza tipo de cambio al cambiar moneda
  */
 useEffect(() => {
  const fetchTipoCambio = async () => {
   if (moneda === "USD" && fechaEmision) {
    try {
     const result = await getExchangeRate(fechaEmision).unwrap();
     const value = result?.compra?.toString() || "3.75";
     setTipoCambio(value);
    } catch {
     setTipoCambio("3.75");
    }
   } else {
    setTipoCambio("1.00");
   }
  };
  fetchTipoCambio();
 }, [moneda, fechaEmision, getExchangeRate]);

 /**
  * Opciones de almacén para ComboBox
  */
 const almacenesOptions = useMemo(
  () => almacenes.map((a) => ({ value: a.id.toString(), label: a.nombre })),
  [almacenes],
 );

 /**
  * Opciones de productos comunes
  */
 const productosOptions = useMemo(
  () =>
   productosComunes.map((p) => ({
    value: p.id.toString(),
    label: `${p.codigo} - ${p.nombre}`,
   })),
  [productosComunes],
 );

 /**
  * Agrega item al detalle de transferencia
  */
 const handleAgregarProducto = () => {
  if (!productoSeleccionado || !cantidadIngresada) return;
  const prod = productosComunes.find(
   (p) => p.id.toString() === productoSeleccionado,
  );
  if (!prod) return;

  const invOrigenItem = inventarioOrigen.find((i) => i.producto.id === prod.id);
  const stockOrigen = invOrigenItem?.stockActual
   ? Number(invOrigenItem.stockActual)
   : undefined;

  const item: TransferDetailItem = {
   id: `${Date.now()}`,
   idProducto: prod.id,
   descripcion: descripcionIngresada || prod.descripcion,
   cantidad: parseFloat(cantidadIngresada),
   stockOrigen,
  };
  setDetalle((prev) => [...prev, item]);

  setProductoSeleccionado("");
  setCantidadIngresada("");
  setDescripcionIngresada("");
 };

 /**
  * Elimina item del detalle
  */
 const handleEliminarProducto = (index: number) => {
  setDetalle((prev) => prev.filter((_, i) => i !== index));
 };

 /**
  * Envía la transferencia al backend
  */
 const handleRegistrarTransferencia = async () => {
  if (
   !almacenOrigen ||
   !almacenDestino ||
   !fechaEmision ||
   !moneda ||
   !serie ||
   !numero ||
   detalle.length === 0
  ) {
   alert("Completa los campos requeridos y añade al menos un detalle");
   return;
  }
  try {
   setApiError(null);
   await createTransfer({
    idAlmacenOrigen: Number(almacenOrigen),
    idAlmacenDestino: Number(almacenDestino),
    fechaEmision,
    moneda,
    tipoCambio: moneda === "USD" ? Number(tipoCambio) : 1,
    serie,
    numero,
    detalles: detalle.map((d) => ({
     idProducto: d.idProducto,
     cantidad: d.cantidad,
     descripcion: d.descripcion,
    })),
   }).unwrap();
   navigate(-1);
  } catch (e) {
   setApiError(e as IApiError);
  }
 };

 const headers = [
  "Producto",
  "Cantidad",
  "Stock Origen",
  "Descripción",
  "Acciones",
 ];
 const rows: TableRow[] = detalle.map((d, idx) => ({
  id: d.id,
  cells: [
   d.idProducto.toString(),
   d.cantidad.toString(),
   (d.stockOrigen ?? 0).toString(),
   d.descripcion,
   <Button
    key={`del-${d.id}`}
    size="tableItemSize"
    variant="tableItemStyle"
    onClick={() => handleEliminarProducto(idx)}
   >
    Eliminar
   </Button>,
  ],
 }));

 return (
  <PageLayout
   title="Registrar transferencia"
   subtitle="Transfiere productos entre almacenes sin montos"
   header={
    <Button variant="secondary" onClick={handleGoBack}>
     Regresar a la vista anterior
    </Button>
   }
  >
   <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    {apiError && (
     <div
      style={{
       padding: "12px",
       borderRadius: "8px",
       background: "#FEE2E2",
       border: "1px solid #FCA5A5",
      }}
     >
      <Text size="sm" color="danger">
       {apiError.message}
      </Text>
      {(apiError.fechaEmision || apiError.periodo) && (
       <Text size="xs" color="danger">
        {[
         apiError.fechaEmision
          ? `Emisión: ${apiError.fechaEmision}`
          : undefined,
         apiError.periodo
          ? `Período: ${apiError.periodo.inicio} → ${apiError.periodo.fin}`
          : undefined,
        ]
         .filter(Boolean)
         .join(" • ")}
       </Text>
      )}
     </div>
    )}
    <Text size="xl" color="neutral-primary">
     Cabecera
    </Text>
    <div
     style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
     }}
    >
     <div>
      <Text size="xs" color="neutral-primary">
       Fecha de emisión
      </Text>
      <Input
       size="xs"
       type="date"
       variant="createSale"
       value={fechaEmision}
       onChange={(e) => setFechaEmision(e.target.value)}
      />
     </div>
     <div>
      <Text size="xs" color="neutral-primary">
       Moneda
      </Text>
      <ComboBox
       size="xs"
       options={[{ value: "PEN", label: "Sol" }]}
       variant="createSale"
       value={moneda}
       onChange={(v) => setMoneda(v as MonedaType)}
      />
     </div>
     {moneda === "USD" && (
      <div>
       <Text size="xs" color="neutral-primary">
        Tipo de cambio
       </Text>
       <Input
        size="xs"
        variant="createSale"
        value={tipoCambio}
        onChange={(e) => setTipoCambio(e.target.value)}
       />
      </div>
     )}
     <div>
      <Text size="xs" color="neutral-primary">
       Serie
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={serie}
       onChange={(e) => setSerie(e.target.value)}
       maxLength={4}
      />
     </div>
     <div>
      <Text size="xs" color="neutral-primary">
       Número
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={numero}
       onChange={(e) => setNumero(e.target.value)}
       maxLength={20}
      />
     </div>
    </div>

    <Divider />

    <Text size="xl" color="neutral-primary">
     Almacenes
    </Text>
    <div
     style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px",
     }}
    >
     <div>
      <Text size="xs" color="neutral-primary">
       Almacén origen
      </Text>
      <ComboBox
       size="xs"
       options={almacenesOptions}
       variant="createSale"
       value={almacenOrigen}
       onChange={(v) => setAlmacenOrigen(String(v))}
      />
     </div>
     <div>
      <Text size="xs" color="neutral-primary">
       Almacén destino
      </Text>
      <ComboBox
       size="xs"
       options={almacenesOptions}
       variant="createSale"
       value={almacenDestino}
       onChange={(v) => setAlmacenDestino(String(v))}
      />
     </div>
    </div>

    <Divider />

    <Text size="xl" color="neutral-primary">
     Detalle
    </Text>
    <div
     style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr 2fr 1fr",
      gap: "16px",
      alignItems: "end",
     }}
    >
     <div>
      <Text size="xs" color="neutral-primary">
       Producto
      </Text>
      <ComboBox
       size="xs"
       options={productosOptions}
       variant="createSale"
       value={productoSeleccionado}
       onChange={(v) => setProductoSeleccionado(String(v))}
       disabled={!almacenOrigen || !almacenDestino}
      />
     </div>
     <div>
      <Text size="xs" color="neutral-primary">
       Cantidad
      </Text>
      <Input
       size="xs"
       type="number"
       variant="createSale"
       value={cantidadIngresada}
       onChange={(e) => setCantidadIngresada(e.target.value)}
      />
     </div>
     <div>
      <Text size="xs" color="neutral-primary">
       Descripción
      </Text>
      <Input
       size="xs"
       variant="createSale"
       value={descripcionIngresada}
       onChange={(e) => setDescripcionIngresada(e.target.value)}
      />
     </div>
     <div>
      <Button
       size="small"
       onClick={handleAgregarProducto}
       disabled={!productoSeleccionado || !cantidadIngresada}
      >
       Agregar
      </Button>
     </div>
    </div>

    {detalle.length > 0 && (
     <Table
      headers={headers}
      rows={rows}
      gridTemplate="1.2fr 0.8fr 0.8fr 2fr 0.8fr"
     />
    )}

    <Divider />

    <div style={{ display: "flex", gap: "12px" }}>
     <Button
      onClick={handleRegistrarTransferencia}
      disabled={isCreatingTransfer}
     >
      Registrar transferencia
     </Button>
     <Button variant="secondary" onClick={handleGoBack}>
      Cancelar
     </Button>
    </div>

    {isCreatingTransfer && <Loader text="Procesando transferencia..." />}
   </div>
  </PageLayout>
 );
};
