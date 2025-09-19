import { useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useAuthSeeder() {
  useEffect(() => {
    const seedAdminUser = async () => {
      const email = 'skuytov@skuytov.eu';
      const password = '410010Kuytov!';
      
      const { data: { users }, error: findError } = await supabase.auth.admin.listUsers({ email });

      if (findError) {
        console.error('Error checking for admin user:', findError);
        return;
      }
      
      const userExists = users && users.length > 0 && users.some(u => u.email === email);

      if (!userExists) {
        console.log('Admin user does not exist, creating...');
        
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: 'skuytov',
              role: 'admin',
            },
          },
        });

        if (signUpError) {
          console.error('Error seeding admin user:', signUpError.message);
        } else if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          console.log('Admin user seeded successfully and confirmed.');
        }
      }
    };

    seedAdminUser();
  }, []);
}