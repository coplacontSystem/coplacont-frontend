import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreatePurchaseForm.module.scss";

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
import { TablaService } from "../../services/TablaService";
import { EntitiesService } from "@/domains/maintainers/services/entitiesService";
import {
  ProductService,
  WarehouseService,
} from "@/domains/maintainers/services";
import { InventoryService } from "@/domains/inventory/services/InventoryService";
import type { Product, Warehouse } from "@/domains/maintainers/types";
import type { InventoryItem } from "@/domains/inventory/services/types";
import type {
  Entidad,
  EntidadParcial,
} from "@/domains/maintainers/services/entitiesService";
import type { Transaction, TablaDetalleResponse } from "../../services/types";
import { MAIN_ROUTES, TRANSACTIONS_ROUTES, COMMON_ROUTES } from "@/router";
import { FormEntidad } from "@/domains/maintainers/organisms/FormEntidad/FormEntidad";
import type { IApiError } from "@/shared";

const TipoCompraEnum = {
  CONTADO: "contado",
  CREDITO: "credito",
} as const;

const TipoProductoCompraEnum = {
  MERCADERIA: "mercaderia",
  SERVICIO: "servicio",
} as const;

const TipoComprobanteEnum = {
  FACTURA: "FACTURA",
  BOLETA: "BOLETA",
  NOTA_ENTRADA: "NOTA DE ENTRADA"
} as const;

const MonedaEnum = {
  SOL: "sol",
  DOLAR: "dol",
} as const;


type TipoCompraType = (typeof TipoCompraEnum)[keyof typeof TipoCompraEnum];
type TipoProductoCompraType =
  (typeof TipoProductoCompraEnum)[keyof typeof TipoProductoCompraEnum];
type TipoComprobanteType =
  (typeof TipoComprobanteEnum)[keyof typeof TipoComprobanteEnum];
type MonedaType = (typeof MonedaEnum)[keyof typeof MonedaEnum];
type ProductoType = string;
type UnidadMedidaType = string;

interface DetalleCompraItem {
  id: string;
  producto: ProductoType;
  descripcion: string;
  unidadMedida: UnidadMedidaType;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  baseGravado: number;
  igv: number;
  isv: number;
  total: number;
  almacen: string;
  idInventario: number;
}

interface CreatePurchaseFormState {
  correlativo: string;
  proveedor: string | "";
  tipoCompra: TipoCompraType | "";
  tipoProductoCompra: TipoProductoCompraType | "";
  tipoComprobante: TipoComprobanteType | "";
  fechaEmision: string;
  moneda: MonedaType | "";
  tipoCambio: string;
  serie: string;
  numero: string;
  fechaVencimiento: string;
  idComprobanteAfecto: string | "";
}

const tipoCompraOptions = [
  { value: TipoCompraEnum.CONTADO, label: "Contado" },
  { value: TipoCompraEnum.CREDITO, label: "Crédito" },
];

const tipoProductoCompraOptions = [
  { value: TipoProductoCompraEnum.MERCADERIA, label: "Mercadería" },
  //{ value: TipoProductoCompraEnum.SERVICIO, label: "Servicio" },
];

// Remove unused tipoComprobanteOptions since we now use dynamic data from API

const monedaOptions = [
  { value: MonedaEnum.SOL, label: "Sol" },
  //{ value: MonedaEnum.DOLAR, label: "Dólar" },
];

// Las opciones de productos ahora se obtienen dinámicamente desde la API de inventario

export const CreatePurchaseForm = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<CreatePurchaseFormState>({
    correlativo: "",
    proveedor: "",
    tipoCompra: "",
    tipoProductoCompra: "",
    tipoComprobante: "",
    fechaEmision: "",
    moneda: "",
    tipoCambio: "",
    serie: "",
    numero: "",
    fechaVencimiento: "",
    idComprobanteAfecto: "",
  });

  // Estado de carga
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<IApiError | null>(null);

  // Estados para el detalle de productos
  const [detalleCompra, setDetalleCompra] = useState<DetalleCompraItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<
    ProductoType | ""
  >("");
  const [unidadMedidaSeleccionada, setUnidadMedidaSeleccionada] = useState<
    UnidadMedidaType | ""
  >("");
  const [cantidadIngresada, setCantidadIngresada] = useState<string>("");
  const [precioUnitarioIngresado, setPrecioUnitarioIngresado] =
    useState<string>("");
  const [precioTotalIngresado, setPrecioTotalIngresado] = useState<string>("");
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>("");

  // Estados para datos de maintainers
  const [proveedores, setProveedores] = useState<Entidad[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  console.log(productos);
  const [almacenes, setAlmacenes] = useState<Warehouse[]>([]);
  console.log(almacenes);
  const [inventarioProductos, setInventarioProductos] = useState<InventoryItem[]>([]);
  const [tiposComprobante, setTiposComprobante] = useState<TablaDetalleResponse[]>([]);

  // Estado para tipo de cambio automático
  const [tipoCambioAutomatico, setTipoCambioAutomatico] = useState<string>("");
  console.log(tipoCambioAutomatico);

  // Estado para compras registradas (para comprobante afecto)
  const [comprasRegistradas, setComprasRegistradas] = useState<Transaction[]>(
    []
  );
  console.log(comprasRegistradas);

  // Estados para modal de nuevo proveedor
  const [showNewProviderModal, setShowNewProviderModal] = useState(false);
  const [providerSearchText, setProviderSearchText] = useState<string>("");
  const [newProviderEntity, setNewProviderEntity] = useState<Partial<Entidad>>(
    {}
  );
  const [newProviderError, setNewProviderError] = useState<string>("");
  const [newProviderLoading, setNewProviderLoading] = useState(false);

  // Estado para costos adicionales
  const [costosAdicionales, setCostosAdicionales] = useState<string>("");

  /**
   * Distribuye los costos adicionales entre todos los items del detalle
   * El costo adicional se divide entre la cantidad total de unidades
   * @param items - Array de items del detalle de compra
   * @param costoAdicional - Monto total a distribuir
   * @returns Array de items con precios unitarios actualizados
   */
  const distribuirCostosAdicionales = (
    items: DetalleCompraItem[],
    costoAdicional: number
  ): DetalleCompraItem[] => {
    if (costoAdicional <= 0 || items.length === 0) {
      return items;
    }

    // Calcular la cantidad total de todos los items
    const cantidadTotal = items.reduce(
      (total, item) => total + item.cantidad,
      0
    );

    if (cantidadTotal === 0) {
      return items;
    }

    // Calcular el costo adicional por unidad (dividir el total entre todas las unidades)
    const costoAdicionalPorUnidad = costoAdicional / cantidadTotal;

    // Aplicar el mismo costo adicional por unidad a todos los items
    return items.map((item) => {
      const nuevoPrecioUnitario = item.precioUnitario + costoAdicionalPorUnidad;

      // Recalcular todos los valores basados en el nuevo precio unitario
      const subtotal = item.cantidad * nuevoPrecioUnitario;
      const baseGravado = subtotal / 1.18; // Asumiendo IGV del 18%
      const igv = subtotal - baseGravado;
      const total = subtotal;

      return {
        ...item,
        precioUnitario: nuevoPrecioUnitario,
        subtotal,
        baseGravado,
        igv,
        total,
      };
    });
  };
  const fetchCorrelativo = async () => {
    try {
      const response = await TransactionsService.getCorrelative(2); // 2 = COMPRA
      setFormState((prev) => ({
        ...prev,
        correlativo: response.correlativo,
      }));
    } catch (error) {
      console.error("Error al obtener el correlativo:", error);
    }
  };
  // Obtener el correlativo al montar el componente
  useEffect(() => {
    fetchCorrelativo();
  }, []);

  // Cargar datos de maintainers al montar el componente
  useEffect(() => {
    const loadMaintainerData = async () => {
      try {
        const [productosData, almacenesData] = await Promise.all([
          ProductService.getAll(),
          WarehouseService.getAll(),
        ]);
        setProductos(productosData);
        setAlmacenes(almacenesData);
      } catch (error) {
        console.error("Error al cargar datos de maintainers:", error);
      }
    };

    loadMaintainerData();
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

  // Cargar proveedores al montar el componente
  useEffect(() => {
    const loadProveedores = async () => {
      try {
        const proveedoresData = await EntitiesService.getSuppliers();
        console.log("Proveedores cargados:", proveedoresData);
        setProveedores(proveedoresData);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
      }
    };

    loadProveedores();
  }, []);

  // Cargar compras registradas al montar el componente
  useEffect(() => {
    const loadComprasRegistradas = async () => {
      try {
        const comprasData = await TransactionsService.getPurchases();
        setComprasRegistradas(comprasData);
      } catch (error) {
        console.error("Error al cargar compras registradas:", error);
      }
    };

    loadComprasRegistradas();
  }, []);

  // Cargar tipos de comprobante al montar el componente
  useEffect(() => {
    const loadTiposComprobante = async () => {
      try {
        const tiposComprobanteData = await TablaService.getTablasByIds("2,4,5,8,9");
        setTiposComprobante(tiposComprobanteData);
      } catch (error) {
        console.error("Error al cargar tipos de comprobante:", error);
      }
    };

    loadTiposComprobante();
  }, []);

  // Obtener tipo de cambio automático cuando cambia la moneda
  useEffect(() => {
    const fetchTipoCambio = async () => {
      if (formState.moneda === MonedaEnum.DOLAR) {
        try {
          const tipoCambioData = await TransactionsService.getTypeExchange(
            formState.fechaEmision
          );
          const tipoCambioValue =
            tipoCambioData.data?.compra?.toString() || "3.75";
          setTipoCambioAutomatico(tipoCambioValue);
          setFormState((prev) => ({
            ...prev,
            tipoCambio: tipoCambioValue,
          }));
        } catch (error) {
          console.error("Error al obtener tipo de cambio:", error);
        }
      } else if (formState.moneda === MonedaEnum.SOL) {
        setTipoCambioAutomatico("1.00");
        setFormState((prev) => ({
          ...prev,
          tipoCambio: "1.00",
        }));
      }
    };

    fetchTipoCambio();
  }, [formState.moneda]);

  // Maneja los cambios en los inputs de texto
  const handleInputChange =
    (field: keyof CreatePurchaseFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  // Maneja los cambios en los ComboBox
  const handleComboBoxChange =
    (field: keyof CreatePurchaseFormState) => (value: string | number) => {
      setFormState((prev) => ({
        ...prev,
        [field]: String(value),
      }));
    };

  // Maneja específicamente el cambio del ComboBox de proveedor
  const handleProviderComboBoxChange = (value: string | number) => {
    setFormState((prev) => ({
      ...prev,
      proveedor: String(value),
    }));
    // Limpiar el texto de búsqueda cuando se selecciona un proveedor
    if (value) {
      setProviderSearchText("");
    }
  };

  // Función para obtener el texto de búsqueda del proveedor
  const getProviderSearchText = (): string => {
    return providerSearchText;
  };

  // Función para abrir el modal de nuevo proveedor
  const handleOpenNewProviderModal = () => {
    // Determinar el tipo de entidad basado en el tipo de comprobante
    const tipoEntidad =
      formState.tipoComprobante === TipoComprobanteEnum.FACTURA
        ? "JURIDICA"
        : "NATURAL";

    // Pre-cargar los datos de la nueva entidad
    const newEntity: Partial<Entidad> = {
      tipo: tipoEntidad as "JURIDICA" | "NATURAL",
      numeroDocumento: getProviderSearchText(),
      esProveedor: true,
      esCliente: false,
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      razonSocial: "",
      direccion: "",
      telefono: "",
    };

    setNewProviderEntity(newEntity);
    setNewProviderError("");
    setShowNewProviderModal(true);
  };

  // Función para cerrar el modal de nuevo proveedor
  const handleCloseNewProviderModal = () => {
    setShowNewProviderModal(false);
  };

  // Función para crear nuevo proveedor
  const handleCreateNewProvider = async () => {
    try {
      setNewProviderLoading(true);
      setNewProviderError("");

      const response = await EntitiesService.postEntidad(
        newProviderEntity as EntidadParcial
      );

      if (response.success) {
        // Recargar la lista de proveedores
        const proveedoresData = await EntitiesService.getSuppliers();
        setProveedores(proveedoresData);

        // Cerrar el modal primero
        setShowNewProviderModal(false);

        // Limpiar el texto de búsqueda
        setProviderSearchText("");

        // Usar setTimeout para asegurar que el ComboBox se actualice con las nuevas opciones
        // antes de seleccionar el nuevo proveedor
        setTimeout(() => {
          setFormState((prev) => ({
            ...prev,
            proveedor: response.data!.id.toString(),
          }));
        }, 100);
      } else {
        setNewProviderError(response.message || "Error al crear el proveedor");
      }
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      setNewProviderError("Error al crear el proveedor");
    } finally {
      setNewProviderLoading(false);
    }
  };

  // Maneja específicamente el cambio de tipo de comprobante
  const handleTipoComprobanteChange = (value: string | number) => {
    const tipoComprobanteValue = String(value) as TipoComprobanteType;

    setFormState((prev) => ({
      ...prev,
      tipoComprobante: tipoComprobanteValue,
      proveedor: "", // Limpiar proveedor al cambiar tipo de comprobante
      idComprobanteAfecto: "", // Limpiar comprobante afecto al cambiar tipo de comprobante
    }));
  };

  // Maneja el cambio de comprobante afecto
  //const handleComprobanteAfectoChange = (value: string | number) => {
  //  setFormState((prev) => ({
  //    ...prev,
  //    idComprobanteAfecto: String(value),
  //  }));
  //};

  // Maneja el cambio de producto seleccionado
  const handleProductoChange = (value: string | number) => {
    const productoId = String(value);
    setProductoSeleccionado(productoId as ProductoType);

    // Buscar la unidad de medida correspondiente al producto seleccionado del inventario
    const productoInventario = inventarioProductos.find(
      (item) => item.producto.id.toString() === productoId
    );
    if (productoInventario) {
      setUnidadMedidaSeleccionada(
        productoInventario.producto.unidadMedida as UnidadMedidaType
      );
    }
  };

  // Maneja el cambio de unidad de medida seleccionada
  const handleUnidadMedidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnidadMedidaSeleccionada(e.target.value as UnidadMedidaType);
  };

  // Maneja el cambio de cantidad ingresada
  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaCantidad = e.target.value;
    setCantidadIngresada(nuevaCantidad);

    // Recalcular precio total si hay precio unitario
    if (precioUnitarioIngresado && nuevaCantidad) {
      const cantidad = parseFloat(nuevaCantidad);
      const precioUnitario = parseFloat(precioUnitarioIngresado);
      if (!isNaN(cantidad) && !isNaN(precioUnitario)) {
        setPrecioTotalIngresado((cantidad * precioUnitario).toString());
      }
    }

    // Recalcular precio unitario si hay precio total
    if (precioTotalIngresado && nuevaCantidad) {
      const cantidad = parseFloat(nuevaCantidad);
      const precioTotal = parseFloat(precioTotalIngresado);
      if (!isNaN(cantidad) && !isNaN(precioTotal) && cantidad > 0) {
        setPrecioUnitarioIngresado((precioTotal / cantidad).toString());
      }
    }
  };

  // Maneja el cambio de precio unitario ingresado
  const handlePrecioUnitarioChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nuevoPrecioUnitario = e.target.value;
    setPrecioUnitarioIngresado(nuevoPrecioUnitario);

    // Calcular precio total automáticamente si hay cantidad
    if (cantidadIngresada && nuevoPrecioUnitario) {
      const cantidad = parseFloat(cantidadIngresada);
      const precioUnitario = parseFloat(nuevoPrecioUnitario);
      if (!isNaN(cantidad) && !isNaN(precioUnitario)) {
        setPrecioTotalIngresado((cantidad * precioUnitario).toString());
      }
    } else {
      setPrecioTotalIngresado("");
    }
  };

  // Maneja el cambio de precio total ingresado
  const handlePrecioTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoPrecioTotal = e.target.value;
    setPrecioTotalIngresado(nuevoPrecioTotal);

    // Calcular precio unitario automáticamente si hay cantidad
    if (cantidadIngresada && nuevoPrecioTotal) {
      const cantidad = parseFloat(cantidadIngresada);
      const precioTotal = parseFloat(nuevoPrecioTotal);
      if (!isNaN(cantidad) && !isNaN(precioTotal) && cantidad > 0) {
        setPrecioUnitarioIngresado((precioTotal / cantidad).toString());
      }
    } else {
      setPrecioUnitarioIngresado("");
    }
  };

  // Maneja el cambio de almacén seleccionado
  const handleAlmacenChange = (value: string | number) => {
    setAlmacenSeleccionado(String(value));
  };

  // Función para validar si todos los campos obligatorios del header están completos y hay items en el detalle
  const areRequiredHeadersComplete = (): boolean => {
    const baseFieldsComplete = !!(
      formState.correlativo &&
      formState.proveedor &&
      formState.tipoCompra &&
      formState.tipoProductoCompra &&
      formState.tipoComprobante &&
      formState.fechaEmision &&
      formState.moneda &&
      formState.serie &&
      formState.numero
    );

    // Validar que haya al menos un item en el detalle
    const hasDetailItems = detalleCompra.length > 0;

    // Si la moneda es dólar, también se requiere tipo de cambio
    if (formState.moneda === MonedaEnum.DOLAR) {
      return baseFieldsComplete && !!formState.tipoCambio && hasDetailItems;
    }

    // Si la moneda es sol, no se requiere tipo de cambio
    return baseFieldsComplete && hasDetailItems;
  };

  // Función para filtrar proveedores según el tipo de comprobante
  const getFilteredProviderOptions = () => {
    if (!formState.tipoComprobante) return [];

    let filteredProviders = proveedores;

    if (formState.tipoComprobante === TipoComprobanteEnum.FACTURA) {
      // Para facturas, solo proveedores jurídicos
      filteredProviders = proveedores.filter(
        (proveedor) => proveedor.tipo === "JURIDICA"
      );
    } else if (formState.tipoComprobante === TipoComprobanteEnum.BOLETA) {
      // Para boletas, solo proveedores naturales
      filteredProviders = proveedores.filter(
        (proveedor) => proveedor.tipo === "NATURAL"
      );
    }

    return filteredProviders.map((proveedor) => ({
      value: proveedor.id.toString(),
      label: `${proveedor.numeroDocumento} - ${
        proveedor.razonSocial ||
        proveedor.nombre +
          " " +
          proveedor.apellidoPaterno +
          " " +
          proveedor.apellidoMaterno
      }`,
    }));
  };

  // Función para obtener el ID del proveedor seleccionado
  const getSelectedProviderId = (): number | null => {
    if (!formState.proveedor) return null;
    return parseInt(formState.proveedor);
  };

  // Función para obtener las opciones de almacenes
  const getAlmacenesOptions = () => {
    return almacenes.map((almacen) => ({
      value: almacen.id.toString(),
      label: `${almacen.nombre}`,
    }));
  };

  // Función para determinar si debe mostrarse el combo de comprobante afecto
  const shouldShowComprobanteAfecto = (): boolean => {
    const seleccionado = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
    const desc = seleccionado?.descripcion?.toUpperCase() || '';
    return desc.includes('NOTA DE CRÉDITO') || desc.includes('NOTA DE CREDITO') || desc.includes('NOTA DE DÉBITO') || desc.includes('NOTA DE DEBITO');
  };

  // Función para obtener las opciones de comprobantes afectos
  const getComprobantesAfectosOptions = () => {
    return comprasRegistradas.map((compra) => ({
      value: compra.idComprobante.toString(),
      label: `${compra.serie}-${compra.numero} - ${compra.fechaEmision}`,
    }));
  };

  // Función para obtener las opciones de productos del inventario
  // Filtra los productos que ya están en el detalle de compra para el almacén seleccionado
  const getProductosInventarioOptions = () => {
    const productosEnDetalle = detalleCompra
      .filter(
        (item) =>
          item.almacen ===
          (almacenes.find((a) => a.id.toString() === almacenSeleccionado)
            ?.nombre || almacenSeleccionado)
      )
      .map((item) => item.producto);

    return inventarioProductos
      .filter(
        (item) => !productosEnDetalle.includes(item.producto.id.toString())
      )
      .map((item) => ({
        value: item.producto.id.toString(),
        label: `${item.producto.codigo} - ${item.producto.nombre}`,
        unidadMedida: item.producto.unidadMedida,
        stockActual: item.stockActual,
        precio: item.producto.precio,
      }));
  };

  // Agrega un producto al detalle de la compra
  const handleAgregarProducto = () => {
    if (
      !productoSeleccionado ||
      !cantidadIngresada ||
      !precioUnitarioIngresado ||
      !unidadMedidaSeleccionada ||
      !almacenSeleccionado
    ) {
      console.warn("Faltan datos para agregar el producto");
      return;
    }

    // Buscar el producto en el inventario
    const productoInventario = inventarioProductos.find(
      (item) => item.producto.id.toString() === productoSeleccionado
    );

    if (!productoInventario) {
      console.warn("Producto no encontrado en el inventario");
      return;
    }

    const cantidad = parseFloat(cantidadIngresada);
    const precioUnitario = parseFloat(precioUnitarioIngresado);
    const subtotal = cantidad * precioUnitario;
    const igv = subtotal * 0.18;
    const isv = 0; // ISV fake
    const total = subtotal + igv + isv;

    const nuevoProducto: DetalleCompraItem = {
      id: `${Date.now()}`,
      producto: productoSeleccionado,
      descripcion: `${productoInventario.producto.codigo} - ${productoInventario.producto.nombre}`,
      unidadMedida: unidadMedidaSeleccionada,
      cantidad,
      precioUnitario,
      subtotal,
      baseGravado: subtotal,
      igv,
      isv,
      total,
      almacen:
        almacenes.find((a) => a.id.toString() === almacenSeleccionado)
          ?.nombre || almacenSeleccionado,
      idInventario: Number(productoInventario.id),
    };

    setDetalleCompra((prev) => [...prev, nuevoProducto]);

    // Limpiar campos después de agregar
    setProductoSeleccionado("");
    setUnidadMedidaSeleccionada("");
    setCantidadIngresada("");
    setPrecioUnitarioIngresado("");
    setPrecioTotalIngresado("");
    // No limpiar almacenSeleccionado para mantener la selección
  };

  // Elimina un producto del detalle de la compra
  // Al eliminar, el producto vuelve a estar disponible en el combo box
  const handleEliminarProducto = (record: DetalleCompraItem, index: number) => {
    setDetalleCompra((prev) => prev.filter((_, i) => i !== index));

    // Si el producto eliminado era el que estaba seleccionado, limpiar la selección
    if (productoSeleccionado === record.producto) {
      setProductoSeleccionado("");
      setUnidadMedidaSeleccionada("");
      setCantidadIngresada("");
      setPrecioUnitarioIngresado("");
      setPrecioTotalIngresado("");
    }

    console.log("Producto eliminado:", record);
  };

  // Maneja el envío del formulario de compra
  const handleAceptarCompra = async () => {
    // Validar que haya al menos un item en el detalle
    if (detalleCompra.length === 0) {
      console.warn("No se puede guardar la compra sin items en el detalle");
      alert("Debe agregar al menos un producto al detalle de la compra");
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      // Aplicar costos adicionales si existen
      let detalleConCostosAdicionales = [...detalleCompra];
      if (costosAdicionales && parseFloat(costosAdicionales) > 0) {
        detalleConCostosAdicionales = distribuirCostosAdicionales(
          detalleCompra,
          parseFloat(costosAdicionales)
        );
      }

      const detallesAPI = detalleConCostosAdicionales.map((item) => ({
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

      // Validar y formatear fechas
      const fechaEmisionValida =
        formState.fechaEmision && formState.fechaEmision.trim() !== "";
      const fechaVencimientoValida =
        formState.fechaVencimiento && formState.fechaVencimiento.trim() !== "";

      const seleccionado = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
      const descSel = seleccionado?.descripcion?.toUpperCase() || '';

      const compraData: import("../../services/types").RegisterPurchasePayload = {
        correlativo: formState.correlativo,
        idPersona: getSelectedProviderId() || 1, // Usar ID del proveedor seleccionado o valor por defecto
        tipoOperacion: descSel,
        tipoComprobante: seleccionado?.descripcion || "",
        fechaEmision: fechaEmisionValida
          ? new Date(formState.fechaEmision).toISOString()
          : new Date().toISOString(),
        moneda: formState.moneda === "sol" ? "PEN" : "USD", // Mapear moneda
        tipoCambio: formState.moneda === "sol" ? 1 : 3.75, // Tipo de cambio fake para dólares
        serie: formState.serie || "F001", // Usar valor del form o fake
        numero: formState.numero || "1234567890", // Usar valor del form o fake
        detalles: detallesAPI,
      };

      // Solo agregar fechaVencimiento si es válida
      if (fechaVencimientoValida) {
        compraData.fechaVencimiento = new Date(
          formState.fechaVencimiento
        ).toISOString();
      }

      // Solo agregar idComprobanteAfecto si existe
      if (formState.idComprobanteAfecto) {
        compraData.idComprobanteAfecto = parseInt(formState.idComprobanteAfecto);
      }

      await TransactionsService.registerPurchase(compraData);

      navigate(`${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}`);
    } catch (error) {
      setApiError(error as IApiError);
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja el envío del formulario de compra y navegación para nueva compra
  const handleAceptarYNuevaCompra = async () => {
    // Validar que haya al menos un item en el detalle
    if (detalleCompra.length === 0) {
      console.warn("No se puede guardar la compra sin items en el detalle");
      alert("Debe agregar al menos un producto al detalle de la compra");
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      // Aplicar costos adicionales si existen
      let detalleConCostosAdicionales = [...detalleCompra];
      if (costosAdicionales && parseFloat(costosAdicionales) > 0) {
        detalleConCostosAdicionales = distribuirCostosAdicionales(
          detalleCompra,
          parseFloat(costosAdicionales)
        );
      }

      const detallesAPI = detalleConCostosAdicionales.map((item) => ({
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

      // Validar y formatear fechas
      const fechaEmisionValida =
        formState.fechaEmision && formState.fechaEmision.trim() !== "";
      const fechaVencimientoValida =
        formState.fechaVencimiento && formState.fechaVencimiento.trim() !== "";

      const seleccionado2 = tiposComprobante.find(t => t.idTablaDetalle.toString() === formState.tipoComprobante);
      const descSel2 = seleccionado2?.descripcion?.toUpperCase() || '';

      const compraData2: import("../../services/types").RegisterPurchasePayload = {
        correlativo: formState.correlativo, // Usar valor del form o fake
        idPersona: getSelectedProviderId() || 1, // Usar ID del proveedor seleccionado o valor por defecto
        tipoOperacion: descSel2,
        tipoComprobante: seleccionado2?.descripcion || "",
        fechaEmision: fechaEmisionValida
          ? new Date(formState.fechaEmision).toISOString()
          : new Date().toISOString(),
        moneda: formState.moneda === "sol" ? "PEN" : "USD", // Mapear moneda
        tipoCambio: formState.moneda === "sol" ? 1 : 3.75, // Tipo de cambio fake para dólares
        serie: formState.serie, // Usar valor del form o fake
        numero: formState.numero, // Usar valor del form o fake
        detalles: detallesAPI,
      };

      // Solo agregar fechaVencimiento si es válida
      if (fechaVencimientoValida) {
        compraData2.fechaVencimiento = new Date(
          formState.fechaVencimiento
        ).toISOString();
      }

      // Solo agregar idComprobanteAfecto si existe
      if (formState.idComprobanteAfecto) {
        compraData2.idComprobanteAfecto = parseInt(formState.idComprobanteAfecto);
      }

      await TransactionsService.registerPurchase(compraData2);

      setFormState({
        correlativo: "",
        proveedor: "",
        tipoCompra: "",
        tipoProductoCompra: "",
        tipoComprobante: "",
        fechaEmision: "",
        moneda: "",
        tipoCambio: "",
        serie: "",
        numero: "",
        fechaVencimiento: "",
        idComprobanteAfecto: "",
      });
      setDetalleCompra([]);
      setProductoSeleccionado("");
      setUnidadMedidaSeleccionada("");
      setCantidadIngresada("");
      setPrecioUnitarioIngresado("");
      setPrecioTotalIngresado("");

      navigate(
        `${MAIN_ROUTES.TRANSACTIONS}${TRANSACTIONS_ROUTES.PURCHASES}${COMMON_ROUTES.REGISTER}`
      );

      fetchCorrelativo();
    } catch (error) {
      setApiError(error as IApiError);
    } finally {
      setIsLoading(false);
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

  // Configuración de la tabla
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

  const tableRows: TableRow[] = detalleCompra.map((item, index) => ({
    id: item.id,
    cells: [
      item.descripcion,
      item.cantidad.toFixed(2),
      item.unidadMedida,
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
        onClick={() => handleEliminarProducto(item, index)}
      >
        <CloseIcon />
      </Button>,
    ],
  }));

  const proveedoresOptionsFromAPI = getFilteredProviderOptions();

  return (
    <div className={styles.CreatePurchaseForm}>
      <Text size="xl" color="neutral-primary">
        Cabecera de compra
      </Text>

      {renderApiError()}

      <div className={styles.CreatePurchaseForm__Form}>
        {/** Fila 1: Correlativo y Proveedor */}
        <div className={styles.CreatePurchaseForm__FormRow}>
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--correlativo"]}`}
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
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--full"]}`}
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

          {/* Mostrar combo de Comprobante afecto solo para notas de crédito y débito */}
          {shouldShowComprobanteAfecto() && (
            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--full"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Comprobante afecto
              </Text>
              <ComboBox
                size="xs"
                options={getComprobantesAfectosOptions()}
                variant="createSale"
                name="idComprobanteAfecto"
                value={formState.idComprobanteAfecto}
                onChange={(v) => setFormState(prev => ({...prev, idComprobanteAfecto: String(v)}))}
              />
            </div>
          )}

          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--proveedor"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Proveedor
            </Text>
            <ComboBox
              size="xs"
              options={proveedoresOptionsFromAPI}
              variant="createSale"
              name="proveedor"
              value={formState.proveedor}
              onChange={handleProviderComboBoxChange}
              onFilterTextChange={setProviderSearchText}
              disabled={!formState.tipoComprobante}
            />
          </div>
          {providerSearchText ||
            (!formState.proveedor && (
              <Button
                size="tableItemSize"
                variant="tableItemStyle"
                onClick={handleOpenNewProviderModal}
              >
                Agregar nuevo proveedor
              </Button>
            ))}
        </div>

        {/** Fila 4: Fecha de emisión, Moneda y Tipo de cambio */}
        <div className={styles.CreatePurchaseForm__FormRow}>
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
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
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
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
              onChange={handleComboBoxChange("moneda")}
            />
          </div>

          {/* Solo mostrar tipo de cambio si la moneda es dólar */}
          {formState.moneda === MonedaEnum.DOLAR && (
            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Tipo de cambio
              </Text>
              <Input
                size="xs"
                variant="createSale"
                value={formState.tipoCambio}
                onChange={handleInputChange("tipoCambio")}
                disabled={!formState.moneda}
              />
            </div>
          )}
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--half"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Condiciones de pago
            </Text>
            <ComboBox
              size="xs"
              options={tipoCompraOptions}
              variant="createSale"
              name="tipoCompra"
              value={formState.tipoCompra}
              onChange={handleComboBoxChange("tipoCompra")}
            />
          </div>
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--half"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Tipo de compra
            </Text>
            <ComboBox
              size="xs"
              options={tipoProductoCompraOptions}
              variant="createSale"
              name="tipoProductoCompra"
              value={formState.tipoProductoCompra}
              onChange={handleComboBoxChange("tipoProductoCompra")}
            />
          </div>
        </div>

        {/** Fila 5: Serie, Número y Fecha de vencimiento */}
        <div className={styles.CreatePurchaseForm__FormRow}>
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
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
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
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
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
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
          <div
            className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--third"]}`}
          >
            <Text size="xs" color="neutral-primary">
              Costos adicionales S/. (opcional)
            </Text>
            <Input
              type="number"
              size="xs"
              variant="createSale"
              value={costosAdicionales}
              onChange={(e) => setCostosAdicionales(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <Divider />

      {/** Detalle de compra - Solo se muestra si se ha seleccionado un tipo de producto/compra */}
      {formState.tipoProductoCompra && (
        <>
          <Text size="xl" color="neutral-primary">
            Detalle de compra
          </Text>

          <div className={styles.CreatePurchaseForm__AddItems}>
            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--medium"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Almacén
              </Text>
              <ComboBox
                size="xs"
                options={getAlmacenesOptions()}
                variant="createSale"
                name="almacen"
                value={almacenSeleccionado}
                onChange={handleAlmacenChange}
              />
            </div>

            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--large"]}`}
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
                onChange={handleProductoChange}
                disabled={!almacenSeleccionado}
              />
            </div>

            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--medium"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Unidad de medida
              </Text>
              <Input
                size="xs"
                variant="createSale"
                value={unidadMedidaSeleccionada}
                onChange={handleUnidadMedidaChange}
                disabled={true}
              />
            </div>

            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--small"]}`}
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
              />
            </div>

            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--small"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Costo unitario
              </Text>
              <Input
                size="xs"
                type="number"
                variant="createSale"
                value={precioUnitarioIngresado}
                onChange={handlePrecioUnitarioChange}
              />
            </div>
            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--small"]}`}
            >
              <Text size="xs" color="neutral-primary">
                Costo Total
              </Text>
              <Input
                size="xs"
                type="number"
                variant="createSale"
                value={precioTotalIngresado}
                onChange={handlePrecioTotalChange}
              />
            </div>

            <div
              className={`${styles.CreatePurchaseForm__FormField} ${styles["CreatePurchaseForm__FormField--button"]}`}
            >
              <Button size="small" onClick={handleAgregarProducto}>
                Agregar
              </Button>
            </div>
          </div>

          {/** Table */}
          {detalleCompra.length > 0 && (
            <>
              <Table
                headers={tableHeaders}
                rows={tableRows}
                gridTemplate="2.5fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1fr 1fr 1.2fr 1fr"
              />

              {/* Mensaje informativo sobre costos adicionales */}
              {costosAdicionales && parseFloat(costosAdicionales) > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    marginBottom: "8px",
                    padding: "8px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <Text size="xs" color="neutral-secondary">
                    A cada producto se le añadirá S/{" "}
                    {(
                      parseFloat(costosAdicionales) /
                      detalleCompra.reduce(
                        (sum, item) => sum + item.cantidad,
                        0
                      )
                    ).toFixed(2)}{" "}
                    por concepto de costos adicionales
                  </Text>
                </div>
              )}

              {/* Totales */}
              <div className={styles.CreatePurchaseForm__Totals}>
                <div className={styles.CreatePurchaseForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    Subtotal:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleCompra
                      .reduce((sum, item) => sum + item.subtotal, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div className={styles.CreatePurchaseForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    IGV:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleCompra
                      .reduce((sum, item) => sum + item.igv, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div className={styles.CreatePurchaseForm__TotalsRow}>
                  <Text size="xs" color="neutral-primary">
                    ISV:
                  </Text>
                  <Text size="xs" color="neutral-primary">
                    S/{" "}
                    {detalleCompra
                      .reduce((sum, item) => sum + item.isv, 0)
                      .toFixed(2)}
                  </Text>
                </div>
                <div
                  className={`${styles.CreatePurchaseForm__TotalsRow} ${styles["CreatePurchaseForm__TotalsRow--total"]}`}
                >
                  <Text size="sm" color="neutral-primary">
                    Total:
                  </Text>
                  <Text size="sm" color="neutral-primary">
                    S/{" "}
                    {detalleCompra
                      .reduce((sum, item) => sum + item.total, 0)
                      .toFixed(2)}
                  </Text>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Divider />

      <div className={styles.CreatePurchaseForm__Actions}>
        <Button
          onClick={handleAceptarCompra}
          disabled={!areRequiredHeadersComplete() || isLoading}
        >
          Aceptar
        </Button>
        <Button
          onClick={handleAceptarYNuevaCompra}
          disabled={!areRequiredHeadersComplete() || isLoading}
        >
          Aceptar y nueva compra
        </Button>
      </div>

      {isLoading && <Loader text="Procesando compra..." />}

      {/* Modal para agregar nuevo proveedor */}
      <Modal
        isOpen={showNewProviderModal}
        onClose={handleCloseNewProviderModal}
        title="Agregar Nuevo Proveedor"
      >
        <FormEntidad
          entidad={newProviderEntity as Entidad}
          error={newProviderError}
          setError={setNewProviderError}
          loading={newProviderLoading}
          setLoading={setNewProviderLoading}
          onChange={(field, value) => {
            setNewProviderEntity((prev) => ({
              ...prev,
              [field]: value,
            }));
          }}
          onSubmit={handleCreateNewProvider}
        />
      </Modal>
    </div>
  );
};
