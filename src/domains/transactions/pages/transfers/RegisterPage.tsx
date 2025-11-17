import { PageLayout, Button, Text, Input, ComboBox, Divider, Loader } from "@/components";
import type { IApiError } from "@/shared";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { WarehouseService } from "@/domains/maintainers/services";
import { InventoryService } from "@/domains/inventory/services/InventoryService";
import { TransactionsService } from "../../services/TransactionsService";
import type { Product, Warehouse } from "@/domains/maintainers/types";
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

  /**
   * Maneja la navegación de regreso a la vista anterior
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  // Estado de cabecera
  const [fechaEmision, setFechaEmision] = useState("");
  const [moneda, setMoneda] = useState<MonedaType>("PEN");
  const [tipoCambio, setTipoCambio] = useState<string>("1.00");
  const [serie, setSerie] = useState("");
  const [numero, setNumero] = useState("");

  // Almacenes y productos comunes
  const [almacenes, setAlmacenes] = useState<Warehouse[]>([]);
  const [almacenOrigen, setAlmacenOrigen] = useState<string>("");
  const [almacenDestino, setAlmacenDestino] = useState<string>("");
  const [productosComunes, setProductosComunes] = useState<Product[]>([]);
  const [inventarioOrigen, setInventarioOrigen] = useState<any[]>([]);

  // Detalle
  const [detalle, setDetalle] = useState<TransferDetailItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
  const [cantidadIngresada, setCantidadIngresada] = useState<string>("");
  const [descripcionIngresada, setDescripcionIngresada] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<IApiError | null>(null);

  /**
   * Carga almacenes al montar
   */
  useEffect(() => {
    WarehouseService.getAll()
      .then((data) => setAlmacenes(data))
      .catch(() => {});
  }, []);

  /**
   * Carga productos comunes cuando ambos almacenes están seleccionados
   */
  useEffect(() => {
    const loadCommon = async () => {
      if (almacenOrigen && almacenDestino) {
        setLoading(true);
        try {
          const [productos, invOrigen] = await Promise.all([
            InventoryService.getCommonProducts(Number(almacenOrigen), Number(almacenDestino)),
            InventoryService.getInventoryByWarehouse(Number(almacenOrigen)),
          ]);
          setProductosComunes(productos);
          setInventarioOrigen(invOrigen);
        } finally {
          setLoading(false);
        }
      } else {
        setProductosComunes([]);
        setInventarioOrigen([]);
      }
    };
    loadCommon();
  }, [almacenOrigen, almacenDestino]);

  /**
   * Actualiza tipo de cambio al cambiar moneda
   */
  useEffect(() => {
    const fetchTipoCambio = async () => {
      if (moneda === "USD") {
        const data = await TransactionsService.getTypeExchange(fechaEmision);
        const value = data?.data?.compra?.toString() || "3.75";
        setTipoCambio(value);
      } else {
        setTipoCambio("1.00");
      }
    };
    fetchTipoCambio();
  }, [moneda, fechaEmision]);

  /**
   * Opciones de almacén para ComboBox
   */
  const almacenesOptions = useMemo(
    () => almacenes.map((a) => ({ value: a.id.toString(), label: a.nombre })),
    [almacenes]
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
    [productosComunes]
  );

  /**
   * Agrega item al detalle de transferencia
   */
  const handleAgregarProducto = () => {
    if (!productoSeleccionado || !cantidadIngresada) return;
    const prod = productosComunes.find((p) => p.id.toString() === productoSeleccionado);
    if (!prod) return;

    const invOrigenItem = inventarioOrigen.find((i) => i.producto.id === prod.id);
    const stockOrigen = invOrigenItem?.stockActual ? Number(invOrigenItem.stockActual) : undefined;

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
    if (!almacenOrigen || !almacenDestino || !fechaEmision || !moneda || !serie || !numero || detalle.length === 0) {
      alert("Completa los campos requeridos y añade al menos un detalle");
      return;
    }
    try {
      setLoading(true);
      setApiError(null);
      await TransactionsService.createTransfer({
        idAlmacenOrigen: Number(almacenOrigen),
        idAlmacenDestino: Number(almacenDestino),
        fechaEmision,
        moneda,
        tipoCambio: moneda === "USD" ? Number(tipoCambio) : 1,
        serie,
        numero,
        detalles: detalle.map((d) => ({ idProducto: d.idProducto, cantidad: d.cantidad, descripcion: d.descripcion })),
      });
      navigate(-1);
    } catch (e) {
      setApiError(e as IApiError);
    } finally {
      setLoading(false);
    }
  };

  const headers = ["Producto", "Cantidad", "Stock Origen", "Descripción", "Acciones"];
  const rows: TableRow[] = detalle.map((d, idx) => ({
    id: d.id,
    cells: [
      d.idProducto.toString(),
      d.cantidad.toString(),
      (d.stockOrigen ?? 0).toString(),
      d.descripcion,
      <Button key={`del-${d.id}`} size="tableItemSize" variant="tableItemStyle" onClick={() => handleEliminarProducto(idx)}>Eliminar</Button>,
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
          <div style={{ padding: "12px", borderRadius: "8px", background: "#FEE2E2", border: "1px solid #FCA5A5" }}>
            <Text size="sm" color="danger">{apiError.message}</Text>
            {(apiError.fechaEmision || apiError.periodo) && (
              <Text size="xs" color="danger">{[apiError.fechaEmision ? `Emisión: ${apiError.fechaEmision}` : undefined, apiError.periodo ? `Período: ${apiError.periodo.inicio} → ${apiError.periodo.fin}` : undefined].filter(Boolean).join(" • ")}</Text>
            )}
          </div>
        )}
        <Text size="xl" color="neutral-primary">Cabecera</Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div>
            <Text size="xs" color="neutral-primary">Fecha de emisión</Text>
            <Input size="xs" type="date" variant="createSale" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">Moneda</Text>
            <ComboBox
              size="xs"
              options={[{ value: "PEN", label: "Sol" }, { value: "USD", label: "Dólar" }]}
              variant="createSale"
              value={moneda}
              onChange={(v) => setMoneda(v as MonedaType)}
            />
          </div>
          {moneda === "USD" && (
            <div>
              <Text size="xs" color="neutral-primary">Tipo de cambio</Text>
              <Input size="xs" variant="createSale" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} />
            </div>
          )}
          <div>
            <Text size="xs" color="neutral-primary">Serie</Text>
            <Input size="xs" variant="createSale" value={serie} onChange={(e) => setSerie(e.target.value)} />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">Número</Text>
            <Input size="xs" variant="createSale" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
        </div>

        <Divider />

        <Text size="xl" color="neutral-primary">Almacenes</Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div>
            <Text size="xs" color="neutral-primary">Almacén origen</Text>
            <ComboBox size="xs" options={almacenesOptions} variant="createSale" value={almacenOrigen} onChange={(v) => setAlmacenOrigen(String(v))} />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">Almacén destino</Text>
            <ComboBox size="xs" options={almacenesOptions} variant="createSale" value={almacenDestino} onChange={(v) => setAlmacenDestino(String(v))} />
          </div>
        </div>

        <Divider />

        <Text size="xl" color="neutral-primary">Detalle</Text>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr", gap: "16px", alignItems: "end" }}>
          <div>
            <Text size="xs" color="neutral-primary">Producto</Text>
            <ComboBox size="xs" options={productosOptions} variant="createSale" value={productoSeleccionado} onChange={(v) => setProductoSeleccionado(String(v))} disabled={!almacenOrigen || !almacenDestino} />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">Cantidad</Text>
            <Input size="xs" type="number" variant="createSale" value={cantidadIngresada} onChange={(e) => setCantidadIngresada(e.target.value)} />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">Descripción</Text>
            <Input size="xs" variant="createSale" value={descripcionIngresada} onChange={(e) => setDescripcionIngresada(e.target.value)} />
          </div>
          <div>
            <Button size="small" onClick={handleAgregarProducto} disabled={!productoSeleccionado || !cantidadIngresada}>Agregar</Button>
          </div>
        </div>

        {detalle.length > 0 && (
          <Table headers={headers} rows={rows} gridTemplate="1.2fr 0.8fr 0.8fr 2fr 0.8fr" />
        )}

        <Divider />

        <div style={{ display: "flex", gap: "12px" }}>
          <Button onClick={handleRegistrarTransferencia} disabled={loading}>Registrar transferencia</Button>
          <Button variant="secondary" onClick={handleGoBack}>Cancelar</Button>
        </div>

        {loading && <Loader text="Procesando transferencia..." />}
      </div>
    </PageLayout>
  );
};
