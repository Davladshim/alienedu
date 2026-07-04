import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const filePath = "C:\\Users\\dasha\\OneDrive\\Desktop\\Платформа\\готовые презентации\\Алгебра 8 класс\\drobi-i-ih-svoistva-8-klass.html";
const fileName = "drobi-i-ih-svoistva-8-klass.html";

const fileContent = readFileSync(filePath);

const { data, error } = await supabase.storage
  .from('presentations')
  .upload(fileName, fileContent, {
    contentType: 'text/html',
    upsert: true,
  });

if (error) {
  console.error('Ошибка:', error);
} else {
  console.log('Успешно загружено:', data.path);
}