import { ImageUpscaler } from "@/components/ImageUpscaler";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
      <main className="flex-grow py-8">
        <ImageUpscaler />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;