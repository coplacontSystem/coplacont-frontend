import { useState } from "react";
import { PageLayout } from "@/components";
import {
  Table,
  type TableRow,
  Button,
  CloseIcon,
  CheckIcon,
  StateTag,
  AddDropdownButton,
  Loader,
} from "@/components";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/domains/maintainers/api/productApi";
import type { Product } from "@/domains/maintainers/types";
import { ProductModal } from "@/domains/maintainers/organisms";

export const MainPage: React.FC = () => {
  const { data: products = [], isLoading: isFetching } = useGetProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const loading = isFetching || isCreating || isUpdating;

  const [isOpen, setIsOpen] = useState(false);
  const [isView, setIsView] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productType, setProductType] = useState<"producto" | "servicio">(
    "producto"
  );

  const [newProduct, setNewProduct] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    unidadMedida: "",
    categoriaId: 0,
  });

  const resetForm = () => {
    setNewProduct({
      codigo: "",
      nombre: "",
      descripcion: "",
      unidadMedida: "",
      categoriaId: 0,
    });
  };

  const handleCreateProduct = async (data: {
    nombre: string;
    descripcion?: string;
    unidadMedida: string;
    idCategoria: number;
  }) => {
    try {
      const payload = {
        ...data,
        categoriaId: data.idCategoria,
        tipo: productType,
        estado: true,
      };
      await createProduct(payload).unwrap();
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setError(`Error al crear el ${productType}`);
      console.error(`Error al crear ${productType}:`, err);
    }
  };

  const handleEditProduct = async (data: {
    nombre: string;
    descripcion: string;
    unidadMedida: string;
    idCategoria: number;
  }) => {
    if (!selectedProduct) return;

    try {
      await updateProduct({
        id: selectedProduct.id,
        data: {
          ...data,
          categoriaId: data.idCategoria,
        },
      }).unwrap();
      setIsOpen(false);
    } catch (err) {
      setError(`Error al actualizar el ${productType}`);
      console.error(`Error al actualizar ${productType}:`, err);
    }
  };

  const handleStateProduct = async (id: number, currentState: boolean) => {
    try {
      await updateProduct({ id, data: { estado: !currentState } }).unwrap();
    } catch (err) {
      setError("Error al cambiar estado del producto");
      console.error("Error al cambiar estado:", err);
    }
  };

  const handleModal = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsView(false);
      setSelectedProduct(null);
    }
  };

  const headers = [
    "Código",
    "Nombre",
    "Descripción",
    "Unidad",
    "Categoría",
    "Estado",
    "Acciones",
  ];

  const rows: TableRow[] = products.map((p) => ({
    id: p.id,
    cells: [
      p.codigo || "No asignado",
      p.nombre || "Sin nombre",
      p.descripcion || "Sin descripción",
      p.unidadMedida || "Sin unidad",
      p.categoria?.nombre || "Sin categoría",
      <StateTag state={p.estado} />,
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            setSelectedProduct(p);
            setProductType(p.tipo as "producto" | "servicio");
            setIsView(true);
            setIsOpen(true);
          }}
        >
          Ver detalles
        </Button>
        <Button
          size="tableItemSize"
          variant="tableItemStyle"
          onClick={() => {
            handleStateProduct(p.id, p.estado);
          }}
        >
          {p.estado ? <CloseIcon /> : <CheckIcon />}
        </Button>
      </div>,
    ],
  }));

  const gridTemplate = "1.5fr 2fr 1.5fr 1fr 1.5fr 1fr 2.5fr";

  return (
    <PageLayout
      title="Productos"
      subtitle="Listado de productos registrados"
      header={
        <AddDropdownButton
          options={[
            {
              label: "Nuevo producto",
              onClick: () => {
                setProductType("producto");
                resetForm();
                setIsView(false);
                setSelectedProduct(null);
                setIsOpen(true);
              },
            },
          ]}
        />
      }
    >
      <Table headers={headers} rows={rows} gridTemplate={gridTemplate} />

      <ProductModal
        isOpen={isOpen}
        onClose={handleModal}
        onSubmit={isView ? handleEditProduct : handleCreateProduct}
        title={
          isView ? "Detalles del producto" : `Creación de nuevo ${productType}`
        }
        description={
          isView
            ? "Información del producto seleccionado."
            : `Ingresa los siguientes datos para registrar un ${productType}.`
        }
        submitLabel={isView ? "Actualizar" : "Guardar"}
        isService={productType === "servicio"}
        initialValues={
          isView && selectedProduct
            ? {
                nombre: selectedProduct.nombre,
                descripcion: selectedProduct.descripcion,
                unidadMedida: selectedProduct.unidadMedida,
                categoriaId: selectedProduct.categoria?.id ?? 0,
              }
            : newProduct
        }
      />

      {loading && <Loader text="Procesando..." />}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </PageLayout>
  );
};
