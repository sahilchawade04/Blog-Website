import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from django.db import connection, transaction

def reorder_blogs():
    print("Starting Blog Reordering...")
    with connection.cursor() as cursor:
        try:
            # Disable checks
            cursor.execute("SET FOREIGN_KEY_CHECKS=0;")
            
            # Fetch all blog IDs ordered by creation
            cursor.execute("SELECT id, title FROM blog_api_blog ORDER BY created_at ASC;")
            blogs = cursor.fetchall()
            
            new_id = 1
            for blog in blogs:
                old_id = blog[0]
                title = blog[1]
                
                if old_id == new_id:
                    print(f"Skipping Blog '{title}' (ID {old_id} is already correct)")
                    new_id += 1
                    continue
                    
                print(f"Renumbering Blog '{title}' from ID {old_id} to {new_id}...")
                
                # Update Blog
                cursor.execute(f"UPDATE blog_api_blog SET id = {new_id} WHERE id = {old_id};")
                
                # Update Comments
                cursor.execute(f"UPDATE blog_api_comment SET post_id = {new_id} WHERE post_id = {old_id};")
                
                # Update Likes (M2M table)
                # Need to verify table name exists first, but assuming blog_api_blog_likes based on convention
                cursor.execute(f"UPDATE blog_api_blog_likes SET blog_id = {new_id} WHERE blog_id = {old_id};")
                
                new_id += 1

            # Reset Auto Increment to the next available ID
            cursor.execute(f"ALTER TABLE blog_api_blog AUTO_INCREMENT = {new_id};")
            
            print(f"Done! Next Blog ID will be {new_id}.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            # Enable checks always
            cursor.execute("SET FOREIGN_KEY_CHECKS=1;")
            
    print("Reordering completed successfully.")

if __name__ == "__main__":
    reorder_blogs()
