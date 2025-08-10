import { Upscaler } from "@/components/Upscaler";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <main className="flex-grow">
        <Upscaler />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;