import oss2
import os

def upload_memo_to_oss(memo_content: str, memo_id: str, access_key_id: str = None, access_key_secret: str = None, bucket_name: str = None, endpoint: str = None):
    """
    Satisfies the Devpost hackathon requirement: 'Proof of Alibaba Cloud Deployment'
    Uploads the final investment decision to an Alibaba Cloud Object Storage Service (OSS) bucket.
    """
    access_key_id = access_key_id or os.getenv('ALIBABA_CLOUD_ACCESS_KEY_ID')
    access_key_secret = access_key_secret or os.getenv('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
    endpoint = endpoint or os.getenv('ALIBABA_OSS_ENDPOINT', 'oss-eu-west-1.aliyuncs.com')
    bucket_name = bucket_name or os.getenv('ALIBABA_OSS_BUCKET', 'agentiz-hackathon-bucket')

    if not access_key_id or not access_key_secret:
        return "Alibaba Cloud OSS credentials not found. Skipping cloud upload."

    try:
        # eu-west-1 requires V4 signatures
        auth = oss2.AuthV4(access_key_id, access_key_secret)
        bucket = oss2.Bucket(auth, endpoint, bucket_name, region='eu-west-1')
        
        file_name = f"memos/memo_{memo_id}.txt"
        
        try:
            # Try to put the object directly
            bucket.put_object(file_name, memo_content.encode('utf-8'))
        except oss2.exceptions.NoSuchBucket:
            # If the bucket does not exist, create it automatically!
            bucket.create_bucket(oss2.models.BUCKET_ACL_PRIVATE)
            # Try uploading again
            bucket.put_object(file_name, memo_content.encode('utf-8'))
            
        return f"Successfully created bucket and uploaded memo to Alibaba OSS: {file_name}"
    except Exception as e:
        return f"Failed to upload to Alibaba Cloud OSS: {str(e)}"
