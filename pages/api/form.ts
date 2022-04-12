import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
    tips: string[]
}

type DataResponse = {
    data: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<DataResponse>) {
    const body = req.body;

    console.log('body: ', body)

    if (!body.tips) {
        return res.status(400).json({ data: 'tips not found' })
    }

    res.status(200).json({ data: `${body.tips}` })
}