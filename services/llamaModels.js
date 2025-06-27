import { loadModel, createLlamaContext, createLlamaChatSession } from 
"llama.rn";
import RNFS from "react-native-fs";

// جدول بكل النماذج
const MODELS = {
  qwen: `${RNFS.DocumentDirectoryPath}/qwen.gguf`,
  mistral: `${RNFS.DocumentDirectoryPath}/mistral.gguf`,
  tinyllama: `${RNFS.DocumentDirectoryPath}/tinyllama.gguf`,
};

export async function setupModel(modelKey) {
  const modelPath = MODELS[modelKey];
  if (!modelPath) throw new Error("❌ النموذج غير موجود");

  const model = await loadModel({ model: modelPath });
  const ctx = await createLlamaContext({ model });
  return createLlamaChatSession({ context: ctx });
}

// إذا بغيت تعرض قائمة النماذج للاختيار
export const AVAILABLE_MODELS = Object.keys(MODELS);

