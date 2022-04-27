import { LoaderFunction, json, ActionFunction, redirect } from "@remix-run/node";
import { Form, useFormAction, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deletePost, editPost, Post } from "~/models/post.server";
import { getPost } from "~/models/post.server";

type LoaderData = { post: Post };

export const loader: LoaderFunction = async ({
    params,
}) => {
    invariant(params.slug, `params.slug is required`);

    const post = await getPost(params.slug);
    invariant(post, `Post not found: ${params.slug}`);

    return json<LoaderData>({ post });
};

type ActionData =
    | {
        slug: null | string;
        title: null | string;
        markdown: null | string;
    }
    | undefined;

export const action: ActionFunction = async ({ request }) => {

    const formData = await request.formData();

    const slug = formData.get("slug");
    const title = formData.get("title");
    const markdown = formData.get("markdown");
    const action = formData.get("_action");

    const errors: ActionData = {
        slug: slug ? null : "Slug is required",
        title: title ? null : "Title is required",
        markdown: markdown ? null : "Markdown is required",
    };
    const hasErrors = Object.values(errors).some(
        (errorMessage) => errorMessage
    );
    if (hasErrors) {
        return json<ActionData>(errors);
    }

    invariant(
        typeof slug === "string",
        "slug must be a string"
    );
    invariant(
        typeof title === "string",
        "title must be a string"
    );
    invariant(
        typeof markdown === "string",
        "markdown must be a string"
    );

    if(action === "delete") {
        await deletePost(slug);
    } else {
        await editPost({ slug, title, markdown });
    }

    return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;
export default function EditPost() {
    const { post } = useLoaderData() as LoaderData;
    return (
        <Form method="post">
            <p>
                <label>
                    Post Slug: {post.slug}
                </label>
                <input
                    type="hidden"
                    name="slug"
                    defaultValue={post.slug}
                />
            </p>
            <p>
                <label>
                    Post Title:{" "}
                    <input
                        type="text"
                        name="title"
                        className={inputClassName}
                        defaultValue={post.title}
                    />
                </label>
            </p>
            <p>
                <label htmlFor="markdown">
                    Markdown:
                </label>
                <br />
                <textarea
                    id="markdown"
                    rows={20}
                    name="markdown"
                    className={`${inputClassName} font-mono`}
                    defaultValue={post.markdown}
                />
            </p>
            <p className="text-right">
                <button
                    type="submit"
                    name="_action" value="delete"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"

                >
                    Delete
                </button>
                <button
                    type="submit"
                    name="_action" value="edit"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"

                >
                    Save Changes
                </button>
            </p>
        </Form>
    );
}