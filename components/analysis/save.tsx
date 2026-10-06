import { NextApiRequest, NextApiResponse } from 'next';
// Import the new function from the created Firestore utility file
import { saveAnalysisResult } from '../../lib/firebase/firestore'; 

export default async function handler(
  req: NextApiRequest, // Fixed implicit 'any'
  res: NextApiResponse // Fixed implicit 'any'
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Data is expected to be in the request body
    const resultData = req.body; 

    // 1. Call the function to save data to Firestore
    const newId = await saveAnalysisResult(resultData);
    
    // 2. Return the new ID so the client can navigate to the results page
    return res.status(201).json({ 
      success: true, 
      message: 'Analysis saved successfully.',
      id: newId // The ID of the newly created document
    });

  } catch (error) {
    console.error('API Error saving analysis:', error);
    // Return a generic error to the client
    return res.status(500).json({ success: false, error: 'Internal server error while saving analysis.' });
  }
}
