import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateSaleForm.module.scss";

import {
  Text,
  Input,
  ComboBox,
  Divider,
  Button,
  CloseIcon,
  Loader,
  Modal,
} from "@/components";
import { Table, type TableRow } from "@/components/organisms/Table";
import { TransactionsService } from "../../services/TransactionsService";
import type { IApiError } from "@/shared";
import { TablaService, type TablaDetalleResponse } from "../../services";
import { EntitiesService } from "@/domains/maintainers/services/entitiesService";
import {
  ProductService,
  WarehouseService,
} from "@/domains/maintainers/services";
import { InventoryService } from "@/domains/inventory/services/InventoryService";
import type { Product, Warehouse } from "@/domains/maintainers/types";
import type {
  Entidad,
  EntidadParcial,
} from "@/domains/maintainers/services/entitiesService";
import { FormEntidad } from "@/domains/maintainers/organisms/FormEntidad/FormEntidad";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";
import { TipoComprobanteEnum, MonedaEnum } from "./enums";
import type {
  TipoComprobanteType,
  MonedaType,
  ProductoType,
  UnidadMedidaType,
} from "./enums";
import {
  tipoVentaOptions,
  tipoProductoVentaOptions,
  monedaOptions,
  unidadMedidaOptions,
} from "./types";
import type { CreateSaleFormState, DetalleVentaItem } from "./types";

export const CreateSaleForm = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<CreateSaleFormState>({
    correlativo: "",
    cliente: "",
    tipoVenta: "",
    tipoProductoVenta: "",
    tipoComprobante: "",
    fechaEmision: "",
    moneda: "",
    tipoCambio: "",
    serie: "",
    numero: "",
    fechaVencimiento: "",
  });

  // Estados para el detalle de productos
  const [detalleVenta, setDetalleVenta] = useState<DetalleVentaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tiposComprobante, setTiposComprobante] = useState<TablaDetalleResponse[]>([]);
  const [ventasRegistradas, setVentasRegistradas] = useState<any[]>([]);
  const [apiError, setApiError] = useState<IApiError | null>(null);

  // Obtener el correlativo al montar el componente

  const fetchCorrelativo = async () => {
    try {
      const response = await TransactionsService.getCorrelative(1); // 1 = VENTA
      setFormState((prev) => ({
        ...prev,
        correlativo: response.correlativo,
      }));
    } catch (error) {
      console.error("Error al obtener el correlativo:", error);
    }
  };

  useEffect(() => {
    fetchCorrelativo();
    
    // Cargar tipos de comprobante desde la API
    const loadTiposComprobante = async () => {
      try {
        const tipos = await TablaService.getTablasByIds("2,4,5,8,9");
        setTiposComprobante(tipos);
      } catch (error) {
        console.error("Error al cargar tipos de comprobante:", error);
      }
    };
    
    loadTiposComprobante();
    TransactionsService.getSales().then((data) => setVentasRegistradas(data));
  }, []);

  const [productoSeleccionado, setProductoSeleccionado] = useState<
    ProductoType | ""
  >("");
  console.log(productoSeleccionado);
  const [unidadMedidaSeleccionada, setUnidadMedidaSeleccionada] = useState<
    UnidadMedidaType | ""
  >("");
  const [cantidadIngresada, setCantidadIngresada] = useState<string>("");
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [precioTotalIngresado, setPrecioTotalIngresado] = useState<string>("");

  const handleInputChange =
    (field: keyof CreateSaleFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleComboBoxChange =
    (field: keyof CreateSaleFormState) => (value: string | number) => {
      setFormState((prev) => ({
        ...prev,
        [field]: String(value),
      }));
    };

  /**
   * Maneja los cambios específicos en el ComboBox de cliente
   * Captura el texto ingresado para poder precargarlo en el formulario de nueva entidad
   */
  const handleClientComboBoxChange = (value: string | number) => {
    setFormState((prev) => ({
      ...prev,
      cliente: String(value),
    }));

    // Si se selecciona un cliente, limpiar el texto de búsqueda
    if (value) {
      setClientSearchText("");
    }
  };

  const handleTipoComprobanteChange = (value: string | number) => {
    const tipoComprobanteValue = String(value) as TipoComprobanteType;

    setFormState((prev) => ({
      ...prev,
      tipoComprobante: tipoComprobanteValue,
      cliente: "",
      fechaVencimiento: "",
    }));
  };

  const isMonedaEnabled = (): boolean => {
    return formState.fechaEmision !== "";
  };

  const isClienteEnabled = (): boolean => {
    return (
      formState.tipoComprobante === TipoComprobanteEnum.FACTURA ||
      formState.tipoComprobante === TipoComprobanteEnum.BOLETA ||
      formState.tipoComprobante === TipoComprobanteEnum.NOTA_SALIDA
    );
  };

  const shouldShowComprobanteAfecto = (): boolean => {
    const seleccionado = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
    const desc = seleccionado?.descripcion?.toUpperCase() || '';
    return desc.includes('NOTA DE CRÉDITO') || desc.includes('NOTA DE CREDITO') || desc.includes('NOTA DE DÉBITO') || desc.includes('NOTA DE DEBITO');
  };

  const getComprobantesAfectosOptions = () => {
    return ventasRegistradas.map((venta: any) => ({
      value: venta.idComprobante.toString(),
      label: `${venta.serie}-${venta.numero} - ${venta.fechaEmision}`,
    }));
  };

  const isDetalleVentaEnabled = () => {
    return formState.tipoProductoVenta !== "";
  };

  /**
   * Valida si todas las cabeceras obligatorias están completas y hay productos en el detalle
   * @returns {boolean} true si todas las cabeceras obligatorias están completas y hay al menos un producto en el detalle
   */
  const areRequiredHeadersComplete = (): boolean => {
    return (
      formState.tipoComprobante !== "" &&
      formState.fechaEmision !== "" &&
      formState.moneda !== "" &&
      formState.tipoVenta !== "" &&
      formState.tipoProductoVenta !== "" &&
      formState.serie !== "" &&
      formState.numero !== "" &&
      (!shouldShowComprobanteAfecto() || formState.fechaVencimiento !== "") &&
      detalleVenta.length > 0
    );
  };

  /**
   * Maneja el cambio de moneda y actualiza el tipo de cambio
   * Si se selecciona dólar, obtiene el tipo de cambio de la SUNAT según la fecha de emisión
   */
  const handleMonedaChange = async (value: string | number) => {
    const monedaValue = String(value) as MonedaType;

    if (monedaValue === MonedaEnum.DOLAR) {
      try {
        // Obtener tipo de cambio de la SUNAT usando la fecha de emisión
        const typeExchangeData = await TransactionsService.getTypeExchange(
          formState.fechaEmision
        );

        setFormState((prev) => ({
          ...prev,
          moneda: monedaValue,
          tipoCambio: typeExchangeData.data?.compra?.toString() || "3.75", // Usar el valor de compra
        }));
      } catch (error) {
        console.error("Error al obtener tipo de cambio:", error);
        // En caso de error, usar valor por defecto
        setFormState((prev) => ({
          ...prev,
          moneda: monedaValue,
          tipoCambio: "3.75",
        }));
      }
    } else {
      // Para soles, limpiar el tipo de cambio
      setFormState((prev) => ({
        ...prev,
        moneda: monedaValue,
        tipoCambio: "",
      }));
    }
  };

  // Maneja el cambio de producto seleccionado
  //const handleProductoChange = (value: string | number) => {
  //  const productoValue = String(value) as ProductoType;
  //  setProductoSeleccionado(productoValue);
  //
  //  // Buscar la unidad de medida correspondiente al producto seleccionado
  //  const productoOption = productosOptions.find(
  //    (option) => option.value === productoValue
  //  );
  //  if (productoOption) {
  //    setUnidadMedidaSeleccionada(productoOption.unidadMedida);
  //  }
  //};

  /**
   * Maneja el cambio de cantidad y recalcula precios automáticamente
   */
  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaCantidad = e.target.value;
    setCantidadIngresada(nuevaCantidad);

    const cantidad = parseFloat(nuevaCantidad);
    if (!isNaN(cantidad) && cantidad > 0) {
      // Si hay precio unitario, recalcular precio total
      if (precioUnitario > 0) {
        const nuevoTotal = cantidad * precioUnitario;
        setPrecioTotalIngresado(nuevoTotal.toString());
      }
      // Si hay precio total, recalcular precio unitario
      else if (precioTotalIngresado && parseFloat(precioTotalIngresado) > 0) {
        const nuevoPrecioUnitario = parseFloat(precioTotalIngresado) / cantidad;
        setPrecioUnitario(nuevoPrecioUnitario);
      }
    }
  };

  /**
   * Maneja el cambio de precio unitario y calcula automáticamente el precio total
   */
  const handlePrecioUnitarioChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nuevoPrecioUnitario = e.target.value;
    const precioNumerico = parseFloat(nuevoPrecioUnitario);

    if (!isNaN(precioNumerico) && precioNumerico >= 0) {
      setPrecioUnitario(precioNumerico);

      // Calcular precio total automáticamente si hay cantidad
      const cantidad = parseFloat(cantidadIngresada);
      if (!isNaN(cantidad) && cantidad > 0) {
        const nuevoTotal = cantidad * precioNumerico;
        setPrecioTotalIngresado(nuevoTotal.toString());
      } else {
        setPrecioTotalIngresado("");
      }
    } else {
      setPrecioUnitario(0);
      setPrecioTotalIngresado("");
    }
  };

  /**
   * Maneja el cambio de precio total y calcula automáticamente el precio unitario
   */
  const handlePrecioTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoPrecioTotal = e.target.value;
    setPrecioTotalIngresado(nuevoPrecioTotal);

    const totalNumerico = parseFloat(nuevoPrecioTotal);
    const cantidad = parseFloat(cantidadIngresada);

    if (
      !isNaN(totalNumerico) &&
      totalNumerico >= 0 &&
      !isNaN(cantidad) &&
      cantidad > 0
    ) {
      const nuevoPrecioUnitario = totalNumerico / cantidad;
      setPrecioUnitario(nuevoPrecioUnitario);
    } else if (!nuevoPrecioTotal) {
      setPrecioUnitario(0);
    }
  };

  // Función para agregar producto al detalle
  const handleAgregarProducto = () => {
    // Validaciones
    if (!productoSeleccionado) {
      alert("Debe seleccionar un producto");
      return;
    }
    if (!cantidadIngresada || parseFloat(cantidadIngresada) <= 0) {
      alert("Debe ingresar una cantidad válida");
      return;
    }
    if (!unidadMedidaSeleccionada) {
      alert("Debe seleccionar una unidad de medida");
      return;
    }
    if (precioUnitario <= 0) {
      alert("El precio unitario debe ser mayor a 0");
      return;
    }

    // Buscar el producto seleccionado en el inventario
    const productoInventario = inventarioProductos.find(
      (item) => item.producto.id.toString() === productoSeleccionado
    );

    if (!productoInventario) {
      alert("Producto no encontrado en el inventario");
      return;
    }

    const cantidad = parseFloat(cantidadIngresada);
    const stockDisponible = Number(productoInventario.stockActual) || 0;
    if (cantidad > stockDisponible) {
      alert(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }

    // Verificar si el producto ya existe en el detalle
    const productoExistente = detalleVenta.find(
      (item) => item.producto === productoSeleccionado
    );

    if (productoExistente) {
      // Si el producto ya existe, actualizar la cantidad y recalcular totales
      setDetalleVenta((prev) =>
        prev.map((item) => {
          if (item.producto === productoSeleccionado) {
            const nuevaCantidad = item.cantidad + cantidad;
            const nuevoSubtotal = nuevaCantidad * precioUnitario;
            const nuevaBaseGravada = nuevoSubtotal; // Base gravada es igual al subtotal (precio sin IGV)
            const nuevoIgv = nuevoSubtotal * 0.18; // IGV como 18% directo del subtotal
            const nuevoTotal = nuevoSubtotal + nuevoIgv; // Total incluye IGV

            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevoSubtotal,
              baseGravado: nuevaBaseGravada,
              igv: nuevoIgv,
              total: nuevoTotal,
            };
          }
          return item;
        })
      );
    } else {
      // Si el producto no existe, agregarlo como nuevo
      const subtotal = cantidad * precioUnitario;
      const baseGravado = subtotal; // Base gravada es igual al subtotal (precio sin IGV)
      const igv = subtotal * 0.18; // IGV como 18% directo del subtotal
      const isv = 0; // ISV por defecto 0
      const total = subtotal + igv; // Total incluye IGV

      const nuevoItem: DetalleVentaItem = {
        id: Date.now().toString(), // ID único temporal
        producto: productoSeleccionado,
        descripcion: productoInventario.producto.nombre,
        unidadMedida: unidadMedidaSeleccionada,
        cantidad,
        precioUnitario,
        subtotal,
        baseGravado,
        igv,
        isv,
        total,
        idInventario: productoInventario.id,
      };

      // Agregar al detalle
      setDetalleVenta((prev) => [...prev, nuevoItem]);
    }

    // Limpiar campos
    setProductoSeleccionado("");
    setUnidadMedidaSeleccionada("");
    setCantidadIngresada("");
    setPrecioUnitario(0);
    setPrecioTotalIngresado("");
  };

  const handleAceptarVenta = async () => {
    setIsLoading(true);
    try {
      setApiError(null);
      const detallesAPI = detalleVenta.map((item) => ({
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida.toUpperCase(),
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        igv: item.igv,
        isc: item.isv, // Mapear isv a isc
        total: item.total,
        descripcion: item.descripcion,
        idInventario: Number(item.idInventario) || 1, // Asegurar que sea un número válido
      }));

      const fechaEmisionValida =
        formState.fechaEmision && formState.fechaEmision.trim() !== "";
      const fechaVencimientoValida =
        formState.fechaVencimiento && formState.fechaVencimiento.trim() !== "";

      const seleccionado = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
      const descSel = seleccionado?.descripcion?.toUpperCase() || '';
      const esNotaCredito = descSel.includes('NOTA DE CRÉDITO') || descSel.includes('NOTA DE CREDITO');
      const esNotaDebito = descSel.includes('NOTA DE DÉBITO') || descSel.includes('NOTA DE DEBITO');
      const idTipoOperacion = esNotaCredito ? 8 : esNotaDebito ? 9 : 13;

      const ventaData: any = {
        correlativo: formState.correlativo,
        idPersona: getSelectedClientId() || 1,
        idTipoOperacion,
        idTipoComprobante: parseInt(formState.tipoComprobante) || 1, // Usar ID del tipo de comprobante seleccionado
        fechaEmision: fechaEmisionValida
          ? new Date(formState.fechaEmision).toISOString()
          : new Date().toISOString(),
        moneda: formState.moneda === "sol" ? "PEN" : "USD",
        tipoCambio:
          formState.moneda === "sol" ? 1 : parseFloat(formState.tipoCambio),
        serie: formState.serie || "F001", // Usar valor del form o fake
        numero: formState.numero || "1234567890", // Usar valor del form o fake
        detalles: detallesAPI,
      };

      // Solo agregar fechaVencimiento si es válida
      if (fechaVencimientoValida) {
        ventaData.fechaVencimiento = new Date(
          formState.fechaVencimiento
        ).toISOString();
      }

      await TransactionsService.registerSale(ventaData);

      navigate(`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}`);
    } catch (error) {
      setApiError(error as IApiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAceptarYNuevaVenta = async () => {
    setIsLoading(true);
    try {
      setApiError(null);
      const detallesAPI = detalleVenta.map((item) => ({
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida.toUpperCase(),
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        igv: item.igv,
        isc: item.isv, // Mapear isv a isc
        total: item.total,
        descripcion: item.descripcion,
        idInventario: Number(item.idInventario) || 1, // Asegurar que sea un número válido
      }));

      const fechaEmisionValida =
        formState.fechaEmision && formState.fechaEmision.trim() !== "";
      const fechaVencimientoValida =
        formState.fechaVencimiento && formState.fechaVencimiento.trim() !== "";

      const seleccionado2 = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
      const descSel2 = seleccionado2?.descripcion?.toUpperCase() || '';
      const esNotaCredito2 = descSel2.includes('NOTA DE CRÉDITO') || descSel2.includes('NOTA DE CREDITO');
      const esNotaDebito2 = descSel2.includes('NOTA DE DÉBITO') || descSel2.includes('NOTA DE DEBITO');
      const idTipoOperacion2 = esNotaCredito2 ? 8 : esNotaDebito2 ? 9 : 13;

      const ventaData: any = {
        correlativo: formState.correlativo || "CORR-12345", // Usar valor del form o fake
        idPersona: getSelectedClientId() || 1, // Usar ID del cliente seleccionado o valor por defecto
        idTipoOperacion: idTipoOperacion2,
        idTipoComprobante: parseInt(formState.tipoComprobante) || 1, // Usar ID del tipo de comprobante seleccionado
        fechaEmision: fechaEmisionValida
          ? new Date(formState.fechaEmision).toISOString()
          : new Date().toISOString(),
        moneda: formState.moneda === "sol" ? "PEN" : "USD", // Mapear moneda
        tipoCambio:
          formState.moneda === "sol" ? 1 : parseFloat(formState.tipoCambio), // Tipo de cambio fake para dólares
        serie: formState.serie || "F001", // Usar valor del form o fake
        numero: formState.numero || "1234567890", // Usar valor del form o fake
        detalles: detallesAPI,
      };

      // Solo agregar fechaVencimiento si es válida
      if (fechaVencimientoValida) {
        ventaData.fechaVencimiento = new Date(
          formState.fechaVencimiento
        ).toISOString();
      }

      await TransactionsService.registerSale(ventaData);

      setFormState({
        correlativo: "",
        cliente: "",
        tipoVenta: "",
        tipoProductoVenta: "",
        tipoComprobante: "",
        fechaEmision: "",
        moneda: "",
        tipoCambio: "",
        serie: "",
        numero: "",
        fechaVencimiento: "",
      });
      setDetalleVenta([]);
      setProductoSeleccionado("");
      setUnidadMedidaSeleccionada("");
      setCantidadIngresada("");

      navigate(
        `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.SALES}${COMMON_ROUTES.REGISTER}`
      );

      fetchCorrelativo();
    } catch (error) {
      setApiError(error as IApiError);
    } finally {
      setIsLoading(false);
    }
  };

  const tableHeaders = [
    "Descripción",
    "Cantidad",
    "U.M.",
    "P. Unitario",
    "Subtotal",
    "Base Gravado",
    "IGV",
    "ISV",
    "Total",
    "Acciones",
  ];

  const handleEliminarProducto = (index: number) => {
    const productoEliminado = detalleVenta[index];
    setDetalleVenta((prev) => prev.filter((_, i) => i !== index));

    // Si el producto eliminado es el que está actualmente seleccionado, limpiar la selección
    if (
      productoEliminado &&
      productoSeleccionado === productoEliminado.producto
    ) {
      setProductoSeleccionado("");
      setUnidadMedidaSeleccionada("");
      setCantidadIngresada("");
      setPrecioUnitario(0);
      setPrecioTotalIngresado("");
    }
  };

  const renderApiError = () => {
    if (!apiError) return null;
    const periodoText = apiError.periodo
      ? `Período: ${apiError.periodo.inicio} → ${apiError.periodo.fin}`
      : undefined;
    const fechaText = apiError.fechaEmision
      ? `Emisión: ${apiError.fechaEmision}`
      : undefined;
    return (
      <div style={{ padding: "12px", borderRadius: "8px", background: "#FEE2E2", border: "1px solid #FCA5A5", marginBottom: "12px" }}>
        <Text size="sm" color="danger">{apiError.message}</Text>
        {(periodoText || fechaText) && (
          <Text size="xs" color="danger">{[fechaText, periodoText].filter(Boolean).join(" • ")}</Text>
        )}
      </div>
    );
  };

  const tableRows: TableRow[] = detalleVenta.map((item, index) => {
    const unidad = unidadMedidaOptions.find(
      (option) => option.value === item.unidadMedida
    );

    return {
      id: item.id,
      cells: [
        item.descripcion,
        item.cantidad.toFixed(2),
        unidad ? unidad.label : item.unidadMedida,
        `S/ ${item.precioUnitario.toFixed(2)}`,
        `S/ ${item.subtotal.toFixed(2)}`,
        `S/ ${item.baseGravado.toFixed(2)}`,
        `S/ ${item.igv.toFixed(2)}`,
        `S/ ${item.isv.toFixed(2)}`,
        `S/ ${item.total.toFixed(2)}`,
        <Button
          key={`delete-${item.id}`}
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => handleEliminarProducto(index)}
        >
          <CloseIcon />
        </Button>,
      ],
    };
  });

  // CLIENTES
  const [clients, setClients] = useState<Entidad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  console.log(products);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  console.log(warehouses);
  const [inventarioProductos, setInventarioProductos] = useState<any[]>([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>("");

  // Estados para el modal de nuevo cliente
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<EntidadParcial>({
    esProveedor: false,
    esCliente: true,
    tipo: "NATURAL",
    numeroDocumento: "",
    nombre: "",
    apellidoMaterno: "",
    apellidoPaterno: "",
    razonSocial: "",
    direccion: "",
    telefono: "",
  });
  const [newClientError, setNewClientError] = useState("");
  const [newClientLoading, setNewClientLoading] = useState(false);

  // Estado para rastrear el texto ingresado en el ComboBox de cliente
  const [clientSearchText, setClientSearchText] = useState("");

  useEffect(() => {
    EntitiesService.getClients().then((data) => {
      setClients(data);
    });
    ProductService.getAll().then((data) => {
      setProducts(data);
    });
    WarehouseService.getAll().then((data) => {
      setWarehouses(data);
    });
  }, []);

  // Cargar productos del inventario cuando se selecciona un almacén
  useEffect(() => {
    const loadInventarioProductos = async () => {
      if (almacenSeleccionado) {
        try {
          const data = await InventoryService.getInventoryByWarehouse(
            Number(almacenSeleccionado)
          );
          setInventarioProductos(data);
        } catch (error) {
          console.error("Error al cargar productos del inventario:", error);
        }
      } else {
        setInventarioProductos([]);
      }
    };

    loadInventarioProductos();
  }, [almacenSeleccionado]);

  const getFilteredClientOptions = () => {
    let filteredClients = clients;

    if (formState.tipoComprobante === TipoComprobanteEnum.FACTURA) {
      filteredClients = clients.filter((client) => client.tipo === "JURIDICA");
    } else if (formState.tipoComprobante === TipoComprobanteEnum.BOLETA) {
      filteredClients = clients.filter((client) => client.tipo === "NATURAL");
    }

    return filteredClients.map((client) => ({
      value: client.id.toString(),
      label: `${client.razonSocial || client.nombreCompleto} - ${
        client.numeroDocumento
      }`,
    }));
  };

  const getAlmacenesOptions = () => {
    return warehouses.map((warehouse) => ({
      value: warehouse.id.toString(),
      label: warehouse.nombre,
    }));
  };

  const getProductosInventarioOptions = () => {
    const productosEnDetalle = detalleVenta.map((item) => item.producto);
    return inventarioProductos
      .filter(
        (item) => !productosEnDetalle.includes(item.producto.id.toString())
      )
      .map((item) => ({
        value: item.producto.id.toString(),
        label: `${item.producto.nombre} (Stock: ${item.stockActual})`,
      }));
  };

  const handleAlmacenChange = (value: string | number) => {
    const stringValue = String(value);
    setAlmacenSeleccionado(stringValue);
    // Limpiar campos relacionados cuando cambia el almacén
    setProductoSeleccionado("");
    setUnidadMedidaSeleccionada("");
    setPrecioUnitario(0);
  };

  const handleProductoInventarioChange = (value: string | number) => {
    const stringValue = String(value);
    setProductoSeleccionado(stringValue as ProductoType);
    const selectedItem = inventarioProductos.find(
      (item) => item.producto.id.toString() === stringValue
    );
    if (selectedItem) {
      // Establecer unidad de medida del producto
      setUnidadMedidaSeleccionada(selectedItem.producto.unidadMedida || "");
      // Establecer precio unitario del producto
      setPrecioUnitario(selectedItem.producto.precioVenta || 0);
    } else {
      // Limpiar campos si no se encuentra el producto
      setUnidadMedidaSeleccionada("");
      setPrecioUnitario(0);
    }
  };

  const clientesOptionsFromAPI = getFilteredClientOptions();

  const getSelectedClientId = (): number | null => {
    if (!formState.cliente) return null;

    const selectedClient = clients.find(
      (client) => client.id.toString() === formState.cliente
    );
    return selectedClient ? selectedClient.id : null;
  };

  /**
   * Determina si se debe mostrar el botón "Agregar nuevo cliente"
   * Se muestra cuando el tipo de comprobante está seleccionado pero no hay cliente seleccionado
   */
  const shouldShowAddClientButton = (): boolean => {
    return isClienteEnabled() && !formState.cliente;
  };

  /**
   * Obtiene el texto ingresado en el ComboBox de cliente para precargarlo en el formulario
   */
  const getClientSearchText = (): string => {
    // Si hay un valor seleccionado, no hay texto libre
    if (formState.cliente) return "";

    // Retornar el texto de búsqueda capturado
    return clientSearchText;
  };

  /**
   * Abre el modal para agregar un nuevo cliente
   * Configura el tipo de entidad según el tipo de comprobante seleccionado
   * Precarga el número de documento si se ingresó texto en el ComboBox
   */
  const handleOpenNewClientModal = () => {
    const tipoEntidad =
      formState.tipoComprobante === TipoComprobanteEnum.FACTURA
        ? "JURIDICA"
        : "NATURAL";
    const numeroDocumentoIngresado = getClientSearchText();

    setNewClientData({
      esProveedor: false,
      esCliente: true,
      tipo: tipoEntidad,
      numeroDocumento: numeroDocumentoIngresado,
      nombre: "",
      apellidoMaterno: "",
      apellidoPaterno: "",
      razonSocial: "",
      direccion: "",
      telefono: "",
    });
    setNewClientError("");
    setIsNewClientModalOpen(true);
  };

  /**
   * Cierra el modal de nuevo cliente
   */
  const handleCloseNewClientModal = () => {
    setIsNewClientModalOpen(false);
    setNewClientError("");
  };

  /**
   * Maneja los cambios en el formulario de nuevo cliente
   */
  const handleNewClientChange = (
    field: keyof Entidad,
    value: string | number | boolean
  ) => {
    setNewClientData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Crea un nuevo cliente y lo selecciona automáticamente
   */
  const handleCreateNewClient = async () => {
    try {
      setNewClientLoading(true);
      const response = await EntitiesService.postEntidad(newClientData);

      if (response.success && response.data) {
        // Actualizar la lista de clientes
        const updatedClients = await EntitiesService.getClients();
        setClients(updatedClients);

        // Seleccionar automáticamente el nuevo cliente
        setFormState((prev) => ({
          ...prev,
          cliente: response.data!.id.toString(),
        }));

        // Cerrar el modal
        handleCloseNewClientModal();
      } else {
        setNewClientError(response.message);
      }
    } catch (error) {
      setNewClientError("Error al crear el cliente");
    } finally {
      setNewClientLoading(false);
    }
  };

  return (
    <div className={styles.CreateSaleForm}>
      <Text size="xl" color="neutral-primary">
        Cabecera de venta
      </Text>

      {renderApiError()}

      {/** Formulario */}
      <div className={styles.CreateSaleForm__Form}>
        {/** Fila 1: Correlativo y Cliente */}
        <div className={styles.CreateSaleForm__FormRow}>
          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--correlativo"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Correlativo
            </Text>
            <Input
              disabled={true}
              size="xs"
              variant="createSale"
              value={formState.correlativo}
              onChange={handleInputChange("correlativo")}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--half"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Tipo de comprobante
            </Text>
            <ComboBox
              size="xs"
              options={tiposComprobante.map(tipo => ({
                value: tipo.idTablaDetalle.toString(),
                label: `${tipo.codigo} - ${tipo.descripcion}`
              }))}
              variant="createSale"
              name="tipoComprobante"
              value={formState.tipoComprobante}
              onChange={handleTipoComprobanteChange}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--cliente"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Cliente
            </Text>
            <ComboBox
              size="xs"
              options={clientesOptionsFromAPI}
              variant="createSale"
              name="cliente"
              value={formState.cliente}
              onChange={handleClientComboBoxChange}
              onFilterTextChange={setClientSearchText}
              disabled={false}// Habilitado solo para FACTURA o BOLETA
            />
          </div>
          {shouldShowAddClientButton() && (
            <Button
              size="tableItemSize"
              variant="tableItemStyle"
              onClick={handleOpenNewClientModal}
            >
              Agregar nuevo cliente
            </Button>
          )}
        </div>

        {/** Fila 2: Fecha de emisión, Moneda y Tipo de cambio */}
        <div className={styles.CreateSaleForm__FormRow}>
          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Fecha de emisión
            </Text>
            <Input
              size="xs"
              type="date"
              variant="createSale"
              value={formState.fechaEmision}
              onChange={handleInputChange("fechaEmision")}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Moneda
            </Text>
            <ComboBox
              size="xs"
              options={monedaOptions}
              variant="createSale"
              name="moneda"
              value={formState.moneda}
              onChange={handleMonedaChange} // Usar el nuevo manejador
              disabled={!isMonedaEnabled()} // Habilitado solo cuando hay fecha de emisión
            />
          </div>

          {/** Campo Tipo de cambio de la SUNAT - Ahora como Input bloqueado */}
          {formState.moneda !== MonedaEnum.SOL && formState.moneda !== "" && (
            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Tipo de cambio de la SUNAT
              </Text>
              <Input
                size="xs"
                variant="createSale"
                value={formState.tipoCambio}
                disabled={true}
              />
            </div>
          )}

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--half"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Condiciones de pago
            </Text>
            <ComboBox
              size="xs"
              options={tipoVentaOptions}
              variant="createSale"
              name="tipoVenta"
              value={formState.tipoVenta}
              onChange={handleComboBoxChange("tipoVenta")}
            />
          </div>
          {shouldShowComprobanteAfecto() && (
            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--cliente"]}`}
            >
              <Text size="xs" color="neutral-primary">Comprobante afecto</Text>
              <ComboBox
                size="xs"
                options={getComprobantesAfectosOptions()}
                variant="createSale"
                name="idComprobanteAfecto"
                value={(formState as any).idComprobanteAfecto || ''}
                onChange={(v) => (setFormState((prev: any) => ({...prev, idComprobanteAfecto: String(v)})))}
              />
            </div>
          )}
        </div>

        {/** Fila 3: Serie, Número y Fecha de vencimiento */}
        <div className={styles.CreateSaleForm__FormRow}>
          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Tipo de venta
            </Text>
            <ComboBox
              size="xs"
              options={tipoProductoVentaOptions}
              variant="createSale"
              name="tipoProductoVenta"
              value={formState.tipoProductoVenta}
              onChange={handleComboBoxChange("tipoProductoVenta")}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Serie
            </Text>
            <Input
              size="xs"
              variant="createSale"
              value={formState.serie}
              onChange={handleInputChange("serie")}
              maxLength={5}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Número
            </Text>
            <Input
              size="xs"
              variant="createSale"
              value={formState.numero}
              onChange={handleInputChange("numero")}
              maxLength={20}
            />
          </div>

          <div
            className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Fecha de vencimiento (opcional)
            </Text>
            <Input
              size="xs"
              type="date"
              variant="createSale"
              value={formState.fechaVencimiento}
              onChange={handleInputChange("fechaVencimiento")}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Mostrar sección de detalle solo si se ha seleccionado un tipo de producto venta */}
      {formState.tipoProductoVenta && (
        <>
          <Text size="xl" color="neutral-primary">
            Detalle de venta
          </Text>

          <div className={styles.CreateSaleForm__AddItems}>
            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Almacen
              </Text>
              <ComboBox
                size="xs"
                options={getAlmacenesOptions()}
                variant="createSale"
                name="almacen"
                value={almacenSeleccionado}
                onChange={handleAlmacenChange}
                disabled={!isDetalleVentaEnabled()}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Producto
              </Text>
              <ComboBox
                size="xs"
                options={getProductosInventarioOptions()}
                variant="createSale"
                name="producto"
                value={productoSeleccionado}
                onChange={handleProductoInventarioChange}
                disabled={!isDetalleVentaEnabled() || !almacenSeleccionado}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--small"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Unidad de medida
              </Text>
              <Input
                size="xs"
                variant="createSale"
                value={unidadMedidaSeleccionada}
                disabled={true}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--small"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Cantidad
              </Text>
              <Input
                size="xs"
                type="number"
                variant="createSale"
                value={cantidadIngresada}
                onChange={handleCantidadChange}
                disabled={!isDetalleVentaEnabled()}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--third"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Precio unitario
              </Text>
              <Input
                size="xs"
                type="number"
                variant="createSale"
                value={precioUnitario.toString()}
                onChange={handlePrecioUnitarioChange}
                disabled={!isDetalleVentaEnabled()}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--small"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Precio Total
              </Text>
              <Input
                size="xs"
                type="number"
                variant="createSale"
                value={precioTotalIngresado}
                onChange={handlePrecioTotalChange}
                disabled={!isDetalleVentaEnabled()}
              />
            </div>

            <div
              className={`${styles.CreateSaleForm__FormField} ${styles["CreateSaleForm__FormField--button"]}`}
            >
              <Button
                size="small"
                onClick={handleAgregarProducto}
                disabled={!isDetalleVentaEnabled()}
              >
                Agregar
              </Button>
            </div>
          </div>

          {/** Table */}
          {detalleVenta.length > 0 && (
            <>
              <Table
                headers={tableHeaders}
                rows={tableRows}
                gridTemplate="2.5fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1fr 1fr 1.2fr 1fr"
              />

              {/* Totales */}
              <div className={styles.CreateSaleForm__Totals}>
                <div className={styles.CreateSaleForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    Subtotal:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleVenta
                      .reduce((sum, item) => sum + item.subtotal, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div className={styles.CreateSaleForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    IGV:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleVenta
                      .reduce((sum, item) => sum + item.igv, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div className={styles.CreateSaleForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    ISV:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleVenta
                      .reduce((sum, item) => sum + item.isv, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div
                  className={`${styles.CreateSaleForm__TotalsRow} ${styles["CreateSaleForm__TotalsRow--total"]}`}
                >
                  <Text size="sm" color="neutral-primary">
                    Total:
                  </Text>
                  <Text size="sm" color="neutral-primary">
                    S/{" "}
                    {detalleVenta
                      .reduce((sum, item) => sum + item.total, 0)
                      .toFixed(2)}
                  </Text>
                </div>
              </div>
            </>
          )}
          <Divider />
        </>
      )}

      {isLoading && <Loader text="Procesando venta..." />}

      <div className={styles.CreateSaleForm__Actions}>
        <Button
          onClick={handleAceptarVenta}
          disabled={!areRequiredHeadersComplete() || isLoading}
        >
          Aceptar
        </Button>
        <Button
          onClick={handleAceptarYNuevaVenta}
          disabled={!areRequiredHeadersComplete() || isLoading}
        >
          Aceptar y nueva venta
        </Button>
      </div>

      {/* Modal para agregar nuevo cliente */}
      <Modal
        isOpen={isNewClientModalOpen}
        onClose={handleCloseNewClientModal}
        title="Agregar Nuevo Cliente"
      >
        <FormEntidad
          entidad={newClientData}
          error={newClientError}
          setError={setNewClientError}
          loading={newClientLoading}
          setLoading={setNewClientLoading}
          onChange={handleNewClientChange}
          onSubmit={handleCreateNewClient}
        />
      </Modal>
    </div>
  );
};
