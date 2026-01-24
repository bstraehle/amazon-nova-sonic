## 実装方針
* UIはTailwindとshadcnを使う
* Server Actionsは必ずnext-safe-actionとともに使う。

### Server Component Best Practices

1. **Define page components as async functions**
   ```typescript
   // Good example
   export default async function MyPage() {
     const data = await fetchData(); // Fetch data on the server
     return <div>{data.title}</div>;
   }
   ```

2. **Don't use Server Actions for initial rendering**
   - For initial rendering, fetch data directly in the Server Component
   - Use Server Actions primarily for data updates after user interactions

   ```typescript
   // Good example - Direct data fetching in Server Component
   export default async function MyPage() {
     // Directly call database functions in Server Component
     const data = await readDataFromDB();
     return <MyComponent initialData={data} />;
   }
   
   // Bad example - Using Server Action for initial rendering
   export default function MyPage() {
     const { data } = useAction(getDataAction);
     // ...
   }
   ```

### Server Actions Pattern

When implementing server-side functionality in the webapp, always use Next.js server actions instead of API Routes:

1. **Server Action Creation Pattern**:
   ```typescript
   'use server';
   
   import { authActionClient } from '@/lib/safe-action';
   import { myActionSchema } from './schemas';
   
   export const myServerAction = authActionClient
     .inputSchema(myActionSchema)
     .action(async ({ parsedInput: { param1, param2 } }) => {
       // Implement server-side logic
       return result;
     });
   ```

2. **Action Schema Definition**:
   ```typescript
   // schemas.ts
   import { z } from 'zod';
   
   export const myActionSchema = z.object({
     param1: z.string(),
     param2: z.number(),
   });
   ```

3. **Only export Server Actions from files with 'use server' directive**
   - Do not export types, interfaces, or other functions
   - Move schemas and other definitions to separate files (e.g., schemas.ts)

   ```typescript
   // Good example
   'use server';
   
   import { authActionClient } from '@/lib/safe-action';
   
   export const saveDataAction = authActionClient
     .inputSchema(saveDataSchema)
     .action(async ({ parsedInput }) => {
       return { success: true };
     });
   ```

5. **Client-side Usage with useAction hook**:
   ```typescript
   'use client';
   
   import { useAction } from 'next-safe-action/hooks';
   import { myServerAction } from '../actions';
   
   // In component:
   const { execute, status, result } = useAction(myServerAction, {
     onSuccess: (data) => {
       // Handle success
     },
     onError: (error) => {
       // Handle error
       const errorMessage = error.error?.serverError || 'An error occurred';
       toast(errorMessage);
     }
   });
   
   const handleSubmit = () => {
     execute({ param1: 'value', param2: 42 });
   };
   ```
