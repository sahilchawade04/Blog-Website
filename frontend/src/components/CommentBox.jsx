import  { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Textarea } from './ui/textarea'
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { LuSend } from "react-icons/lu";
import { Button } from './ui/button';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { setBlog } from '../redux/blogSlice';
import { setComment } from '../redux/commentSlice';
import { Trash2 } from 'lucide-react';
import config from '../config';
import { BsThreeDots } from "react-icons/bs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { formatDate, getInitials } from '../lib/utils'

// eslint-disable-next-line react/prop-types
const CommentBox = ({ selectedBlog }) => {
    const { user } = useSelector(store => store.auth)
    const { comment } = useSelector(store => store.comment)
    const [content, setContent] = useState("")
    const { blog } = useSelector(store => store.blog)
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedContent, setEditedContent] = useState('');

    const dispatch = useDispatch()

    const handleReplyClick = (commentId) => {
        setActiveReplyId(activeReplyId === commentId ? null : commentId);
        setReplyText('');
    };

    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        if (inputText.trim()) {
            setContent(inputText)
        } else {
            setContent('')
        }
    }

    useEffect(() => {
        const getAllCommentsOfBlog = async () => {
            try {
                // eslint-disable-next-line react/prop-types
                const res = await axios.get(`${config.API_URL}/api/v1/comment/${selectedBlog._id}/comment/all`)
                const data = res.data.comments
                dispatch(setComment(data))
            } catch (error) {
                console.log(error);
            }
        }
        getAllCommentsOfBlog()
    // eslint-disable-next-line react/prop-types
    }, [dispatch, selectedBlog._id])

    const commentHandler = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                // eslint-disable-next-line react/prop-types
                `${config.API_URL}/api/v1/comment/${selectedBlog._id}/create`,
                { content },
                {
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );
            if (res.data.success) {
                let updatedCommentData
                if (comment?.length >= 1) {
                    updatedCommentData = [...comment, res.data.comment]
                } else {
                    updatedCommentData = [res.data.comment]
                }
                dispatch(setComment(updatedCommentData))

                const updatedBlogData = blog.map(p =>
                    // eslint-disable-next-line react/prop-types
                    p._id === selectedBlog._id ? { ...p, comments: updatedCommentData } : p
                );
                dispatch(setBlog(updatedBlogData))
                toast.success(res.data.message)
                setContent("")
            }
        } catch (error) {
            console.log(error);
            toast.error("comment add nhi hua")
        }
    }

    // ✅ Reply handler
    const replyHandler = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login to reply");
                return;
            }
            const res = await axios.post(
                `${config.API_URL}/api/v1/comment/${commentId}/reply`,
                { content: replyText },
                {
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                    },
                    withCredentials: true
                }
            );

            if (res.data.success) {
                const updatedComments = comment.map(item =>
                    item._id === commentId
                        ? { ...item, replies: [...(item.replies || []), res.data.reply] }
                        : item
                );
                dispatch(setComment(updatedComments));
                toast.success(res.data.message);
                setReplyText('');
                setActiveReplyId(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Reply add nhi hua");
        }
    };

    const deleteComment = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return toast.error("Please login");
            const res = await axios.delete(`${config.API_URL}/api/v1/comment/${commentId}/delete`, {
                headers: { "Authorization": `Bearer ${token}` },
                withCredentials: true
            })
            if (res.data.success) {
                const updatedCommentData = comment.filter((item) => item._id !== commentId)
                dispatch(setComment(updatedCommentData))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error("comment delete nhi hua bhai")
        }
    }

    const editCommentHandler = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return toast.error("Please login");
            const res = await axios.put(
                `${config.API_URL}/api/v1/comment/${commentId}/edit`,
                { content: editedContent },
                {
                    withCredentials: true,
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                    }
                }
            );

            if (res.data.success) {
                const updatedCommentData = comment.map(item =>
                    item._id === commentId ? { ...item, content: editedContent } : item
                );
                dispatch(setComment(updatedCommentData));
                toast.success(res.data.message);
                setEditingCommentId(null);
                setEditedContent('');
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to edit comment");
        }
    };

    const likeCommentHandler = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login to like comments");
                return;
            }
            const res = await axios.get(
                `${config.API_URL}/api/v1/comment/${commentId}/like?timestamp=${new Date().getTime()}`,
                { 
                    headers: { "Authorization": `Bearer ${token}` },
                    withCredentials: true 
                }
            );

            if (res.data.success) {
                const updatedComment = res.data.updatedComment;
                const updatedCommentList = comment.map(item =>
                    item._id === commentId ? updatedComment : item
                );

                dispatch(setComment(updatedCommentList));
                toast.success(res.data.message)
            }
        } catch (error) {
            console.error("Error liking comment", error);
            toast.error("Something went wrong");
        }
    };

    return (
        <div>
            <div className='flex gap-4 mb-4 items-center'>
                <Avatar>
                    <AvatarImage src={
                        user?.photoUrl 
                        ? (user.photoUrl.startsWith("http") ? user.photoUrl : `${config.API_URL}${user.photoUrl}`) 
                        : ""
                    } />
                    <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
                <h3 className='font-semibold'>{user.firstName} {user.lastName}</h3>
            </div>
            <div className='flex gap-3'>
                <Textarea
                    placeholder="Leave a comment"
                    className="bg-gray-100 dark:bg-gray-800"
                    onChange={changeEventHandler}
                    value={content}
                />
                <Button onClick={commentHandler}><LuSend /></Button>
            </div>
            {
                comment?.length > 0 ? <div className='mt-7 bg-gray-100 dark:bg-gray-800 p-5 rounded-md'>
                    {
                        comment.map((item, index) => {
                            return <div key={index} className='mb-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex gap-3 items-start'>
                                        <Avatar>
                                            <AvatarImage src={
                                                (user?._id === item?.user?._id && user?.photoUrl)
                                                ? (user.photoUrl.startsWith("http") ? user.photoUrl : `${config.API_URL}${user.photoUrl}`)
                                                : (item?.user?.photoUrl ? (item.user.photoUrl.startsWith("http") ? item.user.photoUrl : `${config.API_URL}${item.user.photoUrl}`) : "")
                                            } />
                                            <AvatarFallback>{getInitials(`${item?.user?.firstName} ${item?.user?.lastName}`)}</AvatarFallback>
                                        </Avatar>
                                        <div className='mb-2 space-y-1 md:w-[400px]'>
                                            <h1 className='font-semibold'>{item?.user?.firstName} {item?.user?.lastName} <span className='text-sm ml-2 font-light'>{formatDate(item.createdAt)}</span></h1>
                                            {editingCommentId === item?._id ? (
                                                <>
                                                    <Textarea
                                                        value={editedContent}
                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                        className="mb-2 bg-gray-200 dark:bg-gray-700"
                                                    />
                                                    <div className="flex py-1 gap-2">
                                                        <Button size="sm" onClick={() => editCommentHandler(item._id)}>Save</Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className=''>{item?.content}</p>
                                            )}
                                            <div className='flex gap-5 items-center'>
                                                <div className='flex gap-2 items-center'>
                                                    <div
                                                        className='flex gap-1 items-center cursor-pointer'
                                                        onClick={() => likeCommentHandler(item._id)}
                                                    >
                                                        {
                                                            item.likes.includes(user._id)
                                                                ? <FaHeart fill='red' />
                                                                : <FaRegHeart />
                                                        }
                                                        <span>{item.numberOfLikes}</span>
                                                    </div>
                                                </div>
                                                <p onClick={() => handleReplyClick(item._id)} className='text-sm cursor-pointer'>Reply</p>
                                            </div>
                                        </div>
                                    </div>
                                    {
                                        (user?._id === item?.user?._id || user?.role === 'ADMIN') ? <DropdownMenu>
                                            <DropdownMenuTrigger><BsThreeDots /></DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[180px]">
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingCommentId(item._id);
                                                    setEditedContent(item.content);
                                                }}><Edit />Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500" onClick={() => deleteComment(item._id)}><Trash2 />Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu> : null
                                    }
                                </div>

                                {/* ✅ Reply box */}
                                {
                                    activeReplyId === item?._id &&
                                    <div className='flex gap-3 w-full px-10 mt-2'>
                                        <Textarea
                                            placeholder="Reply here ..."
                                            className="border-2 dark:border-gray-500 bg-gray-200 dark:bg-gray-700"
                                            onChange={(e) => setReplyText(e.target.value)}
                                            value={replyText}
                                        />
                                        <Button onClick={() => replyHandler(item._id)}><LuSend /></Button>
                                    </div>
                                }

                                {/* ✅ Show replies */}
                                {item.replies && item.replies.length > 0 && (
                                    <div className="pl-10 mt-3 space-y-2">
                                        {item.replies.map((rep, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Avatar>
                                                    <AvatarImage src={
                                                        (user?._id === rep?.user?._id && user?.photoUrl)
                                                        ? (user.photoUrl.startsWith("http") ? user.photoUrl : `${config.API_URL}${user.photoUrl}`)
                                                        : (rep?.user?.photoUrl ? (rep.user.photoUrl.startsWith("http") ? rep.user.photoUrl : `${config.API_URL}${rep.user.photoUrl}`) : "")
                                                    } />
                                                    <AvatarFallback>{getInitials(`${rep.user?.firstName} ${rep.user?.lastName}`)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {rep.user?.firstName} {rep.user?.lastName}
                                                        <span className="text-xs font-light ml-2">
                                                            {formatDate(rep.createdAt)}
                                                        </span>
                                                    </h4>
                                                    <p>{rep.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        })
                    }
                </div> : null
            }
        </div>
    )
}

export default CommentBox
