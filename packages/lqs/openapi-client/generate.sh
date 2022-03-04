openapi-generator-cli generate \
    -i /local/api-spec.json \
    --generator-name typescript-axios \
    -o /local/out \
    --additional-properties=useSingleRequestParameter=true