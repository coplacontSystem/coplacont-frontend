import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainPage.module.scss";
import {
  PageLayout,
  Button,
  Table,
  Text,
  ComboBox,
  Modal,
  Loader,
  Input,
} from "@/components";
import { InventoryService } from "../../services/InventoryService";
import {
  ProductService,
  WarehouseService,
} from "@/domains/maintainers/services";
import { MAIN_ROUTES, INVENTORY_ROUTES } from "@/router";
import type { InventoryItem } from "../../services/types";
import type { Product, Warehouse } from "@/domains/maintainers/types";

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [almacenFilter, setAlmacenFilter] = useState(""); // filtro almacén
  const [productoFilter, setProductoFilter] = useState(""); // filtro producto

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [initialModalOpen, setInitialModalOpen] = useState(false);
  const [initialModalLoading, setInitialModalLoading] = useState(false);
  const [initialModalSaving, setInitialModalSaving] = useState(false);
  const [initialModalError, setInitialModalError] = useState<string | null>(
    null
  );
  const [initialEditEnabled, setInitialEditEnabled] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState<number | null>(
    null
  );
  const [initialStockInput, setInitialStockInput] = useState("");
  const [initialPriceInput, setInitialPriceInput] = useState("");
  const [initialOriginal, setInitialOriginal] = useState<{
    stock: string;
    price: string;
  }>({ stock: "", price: "" });
  const [initialStockError, setInitialStockError] = useState<string | null>(
    null
  );
  const [initialPriceError, setInitialPriceError] = useState<string | null>(
    null
  );

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getInventory();
      setInventory(response);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getAll();
      setProducts(response);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await WarehouseService.getAll();
      setWarehouses(response);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  // 🔹 Opciones para los ComboBox
  const almacenOptions = [
    { label: "Todos", value: "" },
    ...Array.from(
      new Map(
        inventory.map((i) => [
          i.almacen.id,
          {
            label: `${i.almacen.id} - ${i.almacen.nombre}`,
            value: String(i.almacen.id),
          },
        ])
      ).values()
    ),
  ];

  const productOptions = [
    { label: "Todos", value: "" },
    ...Array.from(
      new Map(
        inventory.map((i) => [
          i.producto.codigo,
          {
            label: `${i.producto.codigo} - ${i.producto.descripcion}`,
            value: i.producto.codigo,
          },
        ])
      ).values()
    ),
  ];

  // Opciones para el modal
  const modalProductOptions = products.map((product) => ({
    label: `${product.codigo} - ${product.nombre}`,
    value: product.id.toString(),
  }));

  const modalWarehouseOptions = warehouses.map((warehouse) => ({
    label: `${warehouse.id} - ${warehouse.nombre}`,
    value: warehouse.id.toString(),
  }));

  // 🔹 Filtrar inventario por almacén y producto (código o nombre) manually
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );

  useEffect(() => {
    setFilteredInventory(inventory);
  }, [inventory]);

  const handleFilter = () => {
    const result = inventory.filter((i) => {
      const matchAlmacen =
        almacenFilter === "" ||
        String(i.almacen.id)
          .toLowerCase()
          .includes(almacenFilter.toLowerCase()) ||
        i.almacen.nombre.toLowerCase().includes(almacenFilter.toLowerCase());

      const matchProducto =
        productoFilter === "" ||
        i.producto.codigo
          .toLowerCase()
          .includes(productoFilter.toLowerCase()) ||
        i.producto.descripcion
          .toLowerCase()
          .includes(productoFilter.toLowerCase());

      return matchAlmacen && matchProducto;
    });
    setFilteredInventory(result);
  };

  const headers = [
    "COD almacen",
    "Almacén",
    "COD producto",
    "Producto",
    "Stock Actual",
    "Acciones",
  ];

  const rows = filteredInventory.map((i) => ({
    id: i.id,
    cells: [
      i.almacen.id,
      i.almacen.nombre,
      i.producto.codigo,
      i.producto.nombre,
      i.stockActual,
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            navigate(
              `${MAIN_ROUTES.INVENTORY}${INVENTORY_ROUTES.KARDEX}?inventoryId=${i.id}`
            );
          }}
        >
          Ver KARDEX
        </Button>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            const invId = Number(i.id);
            setInitialModalLoading(true);
            setInitialModalError(null);
            setInitialEditEnabled(false);
            setInitialModalOpen(true);
            setCurrentInventoryId(invId);
            InventoryService.getInitialInventory(invId)
              .then((data) => {
                const stock =
                  data.lote?.cantidadInicial ?? data.detalle?.cantidad ?? 0;
                const price = data.lote?.costoUnitario ?? 0;
                setInitialStockInput(String(stock));
                setInitialPriceInput(String(price));
                setInitialOriginal({
                  stock: String(stock),
                  price: String(price),
                });
                setInitialStockError(null);
                setInitialPriceError(null);
              })
              .catch((err) => {
                console.error("Error obteniendo inventario inicial:", err);
                setInitialModalError("No se pudo cargar el inventario inicial");
              })
              .finally(() => setInitialModalLoading(false));
          }}
        >
          Stock Inicial
        </Button>
      </div>,
    ],
  }));

  const gridTemplate = "0.8fr 1fr 1.2fr 2.1fr 0.8fr 1.5fr";

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSelectedProduct("");
    setSelectedWarehouse("");
    setError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct("");
    setSelectedWarehouse("");
    setSelectedStock("");
    setSelectedPrice("");
    setError("");
  };

  const handleSaveProductToWarehouse = async () => {
    if (!selectedProduct || !selectedWarehouse) {
      setError("Por favor selecciona un producto y un almacén.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const stockValue = selectedStock ? Number(selectedStock) : undefined;
      const priceValue = selectedPrice ? Number(selectedPrice) : undefined;

      const payload = {
        idAlmacen: Number(selectedWarehouse),
        idProducto: Number(selectedProduct),
        stockInicial: stockValue,
        precioUnitario: priceValue,
      };

      await InventoryService.createInventory(payload);

      // Cerrar modal y refrescar inventario
      handleCloseModal();
      await fetchInventory();
    } catch (error) {
      console.error("Error al agregar producto al almacén:", error);
      setError(
        "No se pudo agregar el producto al almacén. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Inventario"
      subtitle="Listado de productos disponibles con sus cantidades actuales en stock."
      header={
        <Button onClick={handleOpenModal} size="large">
          + Producto a almacen
        </Button>
      }
    >
      <section className={styles.MainPage}>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Almacén
          </Text>
          <ComboBox
            options={almacenOptions}
            size="xs"
            variant="createSale"
            value={almacenFilter}
            onChange={(v) => setAlmacenFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>
        <div className={styles.MainPage__Filter}>
          <Text size="xs" color="neutral-primary">
            Producto
          </Text>
          <ComboBox
            options={productOptions}
            size="xs"
            variant="createSale"
            value={productoFilter}
            onChange={(v) => setProductoFilter(v as string)}
            placeholder="Seleccionar"
          />
        </div>
        <Button size="small" onClick={handleFilter}>
          Filtrar
        </Button>
      </section>
      <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Agregar producto a almacén"
        description="Selecciona los siguientes datos para asociar un producto a un almacén."
        loading={loading}
        buttonText="Cerrar"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Text size="xs" color="neutral-primary">
              Almacén
            </Text>
            <ComboBox
              options={modalWarehouseOptions}
              size="xs"
              variant="createSale"
              value={selectedWarehouse}
              onChange={(v) => setSelectedWarehouse(v as string)}
              placeholder="Seleccionar"
            />
          </div>
          <div>
            <Text size="xs" color="neutral-primary">
              Producto
            </Text>
            <ComboBox
              options={modalProductOptions}
              size="xs"
              variant="createSale"
              value={selectedProduct}
              onChange={(v) => setSelectedProduct(v as string)}
              placeholder="Seleccionar"
            />
          </div>

          <div>
            <Text size="xs" color="neutral-primary">
              Stock Inicial
            </Text>
            <Input
              type="number"
              size="xs"
              variant="createSale"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              placeholder="Ingresa el stock inicial"
            />
          </div>

          <div>
            <Text size="xs" color="neutral-primary">
              Precio
            </Text>
            <Input
              type="number"
              size="xs"
              variant="createSale"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              placeholder="Ingresa el precio unitario"
            />
          </div>

          {error && (
            <Text size="xs" color="danger">
              {error}
            </Text>
          )}

          <Button
            onClick={handleSaveProductToWarehouse}
            size="large"
            disabled={loading || !selectedProduct || !selectedWarehouse}
          >
            Guardar
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={initialModalOpen}
        onClose={() => {
          setInitialModalOpen(false);
          setCurrentInventoryId(null);
          setInitialEditEnabled(false);
          setInitialStockInput("");
          setInitialPriceInput("");
          setInitialModalError(null);
          setInitialStockError(null);
          setInitialPriceError(null);
        }}
        title="Stock inicial"
        description="Consulta y edición del stock inicial y precio unitario"
        loading={initialModalLoading || initialModalSaving}
        buttonText="Cerrar"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {initialModalLoading && (
            <Loader text="Cargando inventario inicial..." />
          )}
          {!initialModalLoading && initialModalError && (
            <>
              <Text size="xs" color="danger">
                {initialModalError}
              </Text>
              <Button
                size="tableItemSize"
                variant="tableItemStyle"
                onClick={() => {
                  if (!currentInventoryId) return;
                  setInitialModalLoading(true);
                  setInitialModalError(null);
                  InventoryService.getInitialInventory(currentInventoryId)
                    .then((data) => {
                      const stock =
                        data.lote?.cantidadInicial ??
                        data.detalle?.cantidad ??
                        0;
                      const price = data.lote?.costoUnitario ?? 0;
                      setInitialStockInput(String(stock));
                      setInitialPriceInput(String(price));
                      setInitialOriginal({
                        stock: String(stock),
                        price: String(price),
                      });
                      setInitialStockError(null);
                      setInitialPriceError(null);
                    })
                    .catch((err) => {
                      console.error(
                        "Error obteniendo inventario inicial:",
                        err
                      );
                      setInitialModalError(
                        "No se pudo cargar el inventario inicial"
                      );
                    })
                    .finally(() => setInitialModalLoading(false));
                }}
              >
                Reintentar
              </Button>
            </>
          )}
          {!initialModalLoading && !initialModalError && (
            <>
              <div>
                <Text size="xs" color="neutral-primary">
                  Stock Inicial
                </Text>
                <Input
                  type="number"
                  size="xs"
                  variant="createSale"
                  value={initialStockInput}
                  onChange={(e) => {
                    setInitialStockInput(e.target.value);
                    setInitialStockError(null);
                  }}
                  placeholder="Stock inicial"
                  disabled={!initialEditEnabled}
                />
                {initialStockError && (
                  <Text size="xs" color="danger">
                    {initialStockError}
                  </Text>
                )}
              </div>
              <div>
                <Text size="xs" color="neutral-primary">
                  Precio Unitario
                </Text>
                <Input
                  type="number"
                  size="xs"
                  variant="createSale"
                  value={initialPriceInput}
                  onChange={(e) => {
                    setInitialPriceInput(e.target.value);
                    setInitialPriceError(null);
                  }}
                  placeholder="Precio unitario"
                  disabled={!initialEditEnabled}
                />
                {initialPriceError && (
                  <Text size="xs" color="danger">
                    {initialPriceError}
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!initialEditEnabled && (
                  <Button
                    size="tableItemSize"
                    variant="tableItemStyle"
                    onClick={() => setInitialEditEnabled(true)}
                    disabled={initialModalLoading || initialModalSaving}
                  >
                    Actualizar
                  </Button>
                )}
                {initialEditEnabled && (
                  <>
                    <Button
                      size="tableItemSize"
                      variant="tableItemStyle"
                      onClick={() => {
                        setInitialStockInput(initialOriginal.stock);
                        setInitialPriceInput(initialOriginal.price);
                        setInitialStockError(null);
                        setInitialPriceError(null);
                        setInitialEditEnabled(false);
                      }}
                      disabled={initialModalSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="tableItemSize"
                      variant="tableItemStyle"
                      onClick={async () => {
                        if (!currentInventoryId) return;
                        const stockNum = Number(initialStockInput);
                        const priceNum = Number(initialPriceInput);
                        let hasError = false;
                        if (!isFinite(stockNum) || stockNum < 0) {
                          setInitialStockError(
                            "Ingresa un stock válido (>= 0)"
                          );
                          hasError = true;
                        }
                        if (!isFinite(priceNum) || priceNum < 0) {
                          setInitialPriceError(
                            "Ingresa un precio válido (>= 0)"
                          );
                          hasError = true;
                        }
                        if (hasError) return;
                        try {
                          setInitialModalSaving(true);
                          await InventoryService.updateInitialInventory(
                            currentInventoryId,
                            {
                              cantidadInicial: stockNum,
                              costoUnitario: priceNum,
                            }
                          );
                          setInitialEditEnabled(false);
                          await fetchInventory();
                        } catch (err) {
                          console.error(
                            "Error actualizando inventario inicial:",
                            err
                          );
                        } finally {
                          setInitialModalSaving(false);
                        }
                      }}
                      disabled={
                        initialModalSaving ||
                        initialModalLoading ||
                        !initialEditEnabled ||
                        (initialStockInput === initialOriginal.stock &&
                          initialPriceInput === initialOriginal.price)
                      }
                    >
                      Guardar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
      {loading && <Loader text="Procesando..." />}
    </PageLayout>
  );
};
