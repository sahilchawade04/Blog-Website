import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bookmark, Download, MessageSquare, Share2 } from "lucide-react";
import CommentBox from "../components/CommentBox";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { setBlog } from "../redux/blogSlice";
import { toast } from "sonner";
import placeholder from "../assets/blog1.png"
import { formatDate, getInitials } from "../lib/utils";

const BlogView = () => {
  const { blogId } = useParams();
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { blog = [] } = useSelector((store) => store.blog);
  const { user } = useSelector((store) => store.auth);
  const { comment = [] } = useSelector((store) => store.comment);

  const selectedBlog = blog?.find((b) => b?._id == blogId);

  const [blogLike, setBlogLike] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  /* --------------------- INIT BLOG DATA --------------------- */
  useEffect(() => {
    const fetchSingleBlog = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/blog/${blogId}`, {
          withCredentials: true
        });
        
        if (res.data) {
           // Avoid duplicates
           const exists = blog.find(b => b._id == res.data._id || b._id == res.data.id);
           if (!exists) {
               dispatch(setBlog([...blog, res.data]));
           }
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 404) {
            toast.error("This blog has been deleted or moved.");
            navigate("/"); // Redirect to home on 404
        } else {
            toast.error("Failed to load blog");
        }
        setLoading(false);
      }
    };

    // Always fetch latest data to ensure blog exists and get latest comments/likes
    fetchSingleBlog();

    if (selectedBlog && user) {
      setBlogLike(selectedBlog?.likes?.length || 0);
      setLiked(selectedBlog?.likes?.includes(user?._id));
    }
  }, [blogId, dispatch, selectedBlog, user]); // Optimized dependencies

  // Separate effect for syncing local state when data/user changes
  useEffect(() => {
    if (selectedBlog && user) {
      setBlogLike(selectedBlog?.likes?.length || 0);
      setLiked(selectedBlog?.likes?.includes(user?._id));
    }
  }, [selectedBlog, user]);

  /* --------------------- SCROLL TOP --------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* --------------------- LIKE / DISLIKE --------------------- */
  const likeOrDislikeHandler = async () => {
    if (!selectedBlog || !user) return;

    try {
      const action = liked ? "dislike" : "like";
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to like this post");
        return;
      }
      const res = await axios.get(
        `http://127.0.0.1:8000/api/v1/blog/${selectedBlog._id}/${action}?timestamp=${new Date().getTime()}`,
        { 
            headers: {
                "Authorization": `Bearer ${token}` 
            },
            withCredentials: true 
        }
      );

      if (res.data.success) {
        const updatedLikes = liked ? blogLike - 1 : blogLike + 1;
        setBlogLike(updatedLikes);
        setLiked(!liked);

        const updatedBlogData = blog.map((b) =>
          b._id == selectedBlog._id // Loose equality for safety
            ? {
                ...b,
                likes: liked
                  ? b.likes.filter((id) => String(id) !== String(user._id)) // String comparison
                  : [...b.likes, user._id],
              }
            : b
        );

        dispatch(setBlog(updatedBlogData));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          // Optionally dispatch(setUser(null)) if imported, but for now force redirect
          window.location.href = "/login"; 
          // or use navigate("/login") if available in scope. 
          // navigate is not defined in this scope? Wait, let's check.
          // navigate IS NOT defined in BlogView.jsx top level?
          // Let's check imports. Lines 10: import { Link, useParams } from "react-router-dom";
          // Missing useNavigate. I should add it.
          // For now, simpler to use window.location.href to ensure full clean state or add useNavigate.
      } else {
          toast.error(error?.response?.data?.message || "Like action failed");
      }
    }
  };

  /* --------------------- DELETE BLOG --------------------- */
  const deleteBlog = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please login");
        
        const res = await axios.delete(`http://127.0.0.1:8000/api/v1/blog/delete/${selectedBlog._id}`, { 
            headers: { "Authorization": `Bearer ${token}` },
            withCredentials: true 
        })
        if (res.data.success) {
            // Remove from Redux state
            const updatedBlogData = blog.filter((blogItem) => blogItem._id !== selectedBlog._id);
            dispatch(setBlog(updatedBlogData));
            toast.success("Blog deleted successfully");
            navigate("/blogs"); // Redirect to blogs list
        }
    } catch (error) {
        console.log(error);
        toast.error("Failed to delete blog");
    }
  }

  /* --------------------- DATE FORMAT --------------------- */
  const changeTimeFormat = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* --------------------- SHARE --------------------- */
  const handleShare = (blogId) => {
    const blogUrl = `${window.location.origin}/blogs/${blogId}`;

    if (navigator.share) {
      navigator.share({
        title: "Check out this blog!",
        text: "Read this amazing blog post.",
        url: blogUrl,
      });
    } else {
      navigator.clipboard.writeText(blogUrl);
      toast.success("Blog link copied!");
    }
  };

  /* --------------------- LOADING --------------------- */
  if (loading || (!selectedBlog && blogId)) {
    return (
      <div className="pt-20 text-center text-lg">
        Loading blog...
      </div>
    );
  }

  /* --------------------- UI --------------------- */
  return (
    <div className="pt-14">
      <div className="max-w-6xl mx-auto p-10">

        {/* Breadcrumb */}
        <div className="print:hidden">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link to="/">Home</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Link to="/blogs">Blogs</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedBlog?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="my-8">
          <h1 className="text-4xl font-bold mb-4">
            {selectedBlog?.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={
                  (user?._id === selectedBlog?.author?._id && user?.photoUrl) 
                    ? (user.photoUrl.startsWith("http") ? user.photoUrl : `http://127.0.0.1:8000${user.photoUrl}`)
                    : (selectedBlog?.author?.photoUrl?.startsWith("http") 
                        ? selectedBlog?.author?.photoUrl 
                        : `http://127.0.0.1:8000${selectedBlog?.author?.photoUrl}`)
                } />
                <AvatarFallback>{getInitials(
                    user?._id === selectedBlog?.author?._id 
                      ? `${user?.firstName} ${user?.lastName}` 
                      : `${selectedBlog?.author?.firstName} ${selectedBlog?.author?.lastName}`
                )}</AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">
                  {user?._id === selectedBlog?.author?._id ? user?.firstName : selectedBlog?.author?.firstName}{" "}
                  {user?._id === selectedBlog?.author?._id ? user?.lastName : selectedBlog?.author?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                   {
                     (user?._id === selectedBlog?.author?._id) 
                       ? ((user?.occupation && user?.occupation !== "null") ? user.occupation : "Full Stack Developer")
                       : ((selectedBlog?.author?.occupation && selectedBlog?.author?.occupation !== "null") ? selectedBlog.author.occupation : "Full Stack Developer")
                   }
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Published on {formatDate(selectedBlog?.publishedAt || selectedBlog?.createdAt)}
            </p>
          </div>
          
          {/* Admin/Author Actions */}
          { (user?.role === 'ADMIN' || user?._id === selectedBlog?.author?._id) && (
              <div className="flex justify-end gap-2 mt-4 print:hidden w-full">
                  <Button variant="outline" onClick={() => navigate(`/dashboard/write-blog/${selectedBlog._id}`)}>Edit</Button>
                  <Button variant="destructive" onClick={deleteBlog}>Delete</Button>
              </div>
          )}
        </div>

        {/* Image */}
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={
              selectedBlog?.thumbnail
                ? (selectedBlog.thumbnail.startsWith("http") ? selectedBlog.thumbnail : `http://127.0.0.1:8000${selectedBlog.thumbnail}`)
                : placeholder
            }
            alt="Blog"
            className="w-full max-h-[500px] object-cover rounded-lg"
          />
          <p className="text-sm italic text-muted-foreground mt-2">
            {selectedBlog?.subtitle}
          </p>
        </div>

        {/* Description */}
        {selectedBlog?.description && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedBlog.description }}
          />
        )}

        {/* Tags */}
        <div className="flex gap-2 my-8 print:hidden">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">JavaScript</Badge>
          <Badge variant="secondary">Web Dev</Badge>
        </div>

        {/* Engagement */}
        <div className="flex justify-between items-center border-y py-4 print:border-none">
          <div className="flex gap-4 items-center print:hidden">
            <Button variant="ghost" onClick={likeOrDislikeHandler}>
              {liked ? (
                <FaHeart size={22} className="text-red-600" />
              ) : (
                <FaRegHeart size={22} />
              )}
              <span className="ml-1">{blogLike}</span>
            </Button>

            <Button variant="ghost">
              <MessageSquare size={18} />
              <span className="ml-1">{comment.length}</span>
            </Button>
          </div>

            <div className="flex gap-2 print:hidden">
            <Button variant="ghost" onClick={() => window.print()}>
              <Download size={18} />
            </Button>
            <Button variant="ghost" onClick={() => handleShare(selectedBlog._id)}>
              <Share2 size={18} />
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="print:hidden">
           {selectedBlog && <CommentBox selectedBlog={selectedBlog} />}
        </div>
      </div>
    </div>
  );
};

export default BlogView;
