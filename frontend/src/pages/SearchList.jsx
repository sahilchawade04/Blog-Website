import BlogCard from '../components/BlogCard';
import  { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const SearchList = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    const { blog } = useSelector(store => store.blog)

    console.log(blog);


    const filteredBlogs = blog.filter(
        (blog) =>
            blog.title.toLowerCase().includes(query?.toLowerCase()) ||
            blog.subtitle.toLowerCase().includes(query?.toLowerCase()) ||
            blog.category.toLowerCase() === query?.toLowerCase()
    );
   
    useEffect(()=>{
        window.scrollTo(0,0)
    },[])
    return (
        <div className='pt-32'>
            <div className='max-w-6xl mx-auto'>
                <h2 className='mb-5'>Search Results for: &quot;{query}&quot;</h2>
                {/* Here you can fetch data or display filtered results based on the query */}
                <div className='grid grid-cols-3 gap-7 my-10'>
                    {
                        // eslint-disable-next-line no-unused-vars
                        filteredBlogs.map((blog, index) => {
                            // eslint-disable-next-line react/jsx-key
                            return <BlogCard  blog={blog} />
                        })
                    }

                </div>

            </div>
        </div>
    )
}

export default SearchList
