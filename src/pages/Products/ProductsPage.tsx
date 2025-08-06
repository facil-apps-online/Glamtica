import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import ProductCatalog from "./ProductCatalog"; // Lo crearemos a continuación
// import BranchProductManager from "./BranchProductManager"; // Lo crearemos a continuación

const ProductsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Productos</h1>
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo General</TabsTrigger>
          <TabsTrigger value="branch">Gestión por Sucursal</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog">
          {/* <ProductCatalog /> */}
          <p className="text-muted-foreground p-4">Componente del Catálogo General de Productos irá aquí.</p>
        </TabsContent>
        <TabsContent value="branch">
          {/* <BranchProductManager /> */}
          <p className="text-muted-foreground p-4">Componente de Gestión de Productos por Sucursal irá aquí.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsPage;
