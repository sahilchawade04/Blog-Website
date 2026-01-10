/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import placeholder from "../assets/blog1.png"
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../lib/utils'
import config from '../config';

const BlogCardList = ({ blog }) => {
    const navigate = useNavigate()
    return (
        <div className="bg-white dark:bg-gray-700 dark:border-gray-600 flex flex-col md:flex-row md:gap-10 p-5 rounded-2xl mt-6 shadow-lg border  transition-all">
            <div>
            <img 
                src={
                    blog.thumbnail 
                        ? (blog.thumbnail.startsWith("http") ? blog.thumbnail : `${config.API_URL}${blog.thumbnail}`)
                        : placeholder
                } 
                alt="" 
                className='rounded-lg md:w-[300px] hover:scale-105 transition-all' 
            />


            </div>
            <div>
                <p className="text-xs text-gray-500 mb-2">
                    {blog.author.firstName} | {blog.category} | {formatDate(blog.isPublished ? blog.publishedAt : blog.createdAt)}
                </p>
                <h2 className="text-2xl font-semibold mt-3 md:mt-1">{blog.title}</h2>
                <h3 className='text-gray-500 mt-1 '>{blog.subtitle}</h3>
                <Button onClick={() => navigate(`/blogs/${blog._id}`)} className="mt-4   px-4 py-2 rounded-lg text-sm ">
                    Read More
                </Button>
            </div>
        </div>
    )
}

export default BlogCardList
